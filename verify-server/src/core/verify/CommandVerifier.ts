import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProjectType, RepoContext } from "../workspace/Workspace";
import type { Verifier, VerifyRequest, VerificationResult, VerificationFailure } from "./types";

export interface CommandVerifierOptions {
  /** Explicit argv to run, skipping auto-detection. The escape hatch for CI/tests. */
  command?: string[];
  /** Per-run timeout (default 120s). */
  timeoutMs?: number;
  /** Max chars of combined output to retain (default 20k). */
  maxOutput?: number;
}

/** npm's default placeholder `test` script — treat as "no tests", not a real check. */
const PLACEHOLDER_TEST = /no test specified/i;
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_OUTPUT = 20_000;

/**
 * The deterministic Verifier: it runs the repository's *own* check command — the
 * thing a developer would run — and reports pass/fail with parsed failures. No
 * key, no network. This is the Phase-6 floor: every build can now be told whether
 * the code it produced actually passes, and a Claude-backed repair loop builds on
 * top of exactly this signal.
 */
export class CommandVerifier implements Verifier {
  readonly id = "command-verifier@1";

  constructor(private readonly opts: CommandVerifierOptions = {}) {}

  async verify(req: VerifyRequest): Promise<VerificationResult> {
    const started = Date.now();
    const argv = this.opts.command ?? (await detectVerifyCommand(req.root, req.repo));

    if (!argv || argv.length === 0) {
      return {
        ran: false,
        command: null,
        exitCode: null,
        passed: false,
        durationMs: Date.now() - started,
        failures: [],
        output: "",
        summary: "no test/verify command detected — verification skipped",
      };
    }

    const timeoutMs = req.timeoutMs ?? this.opts.timeoutMs ?? DEFAULT_TIMEOUT;
    const maxOutput = this.opts.maxOutput ?? DEFAULT_MAX_OUTPUT;
    const display = argv.join(" ");
    const { code, output, timedOut } = await runCommand(argv, req.root, timeoutMs, maxOutput);
    const passed = code === 0 && !timedOut;
    const failures = passed ? [] : parseFailures(output, req.repo.projectType);

    const summary = timedOut
      ? `\`${display}\` timed out after ${timeoutMs}ms`
      : passed
        ? `\`${display}\` passed`
        : `\`${display}\` failed (exit ${code ?? "—"}${failures.length ? `, ${failures.length} issue(s)` : ""})`;

    return {
      ran: true,
      command: display,
      exitCode: code,
      passed,
      durationMs: Date.now() - started,
      failures,
      output,
      summary,
    };
  }
}

/**
 * Pick the command that best represents "is this repo healthy?". Prefers the
 * project's declared `test` script, then `typecheck`, then `build`; falls back to
 * a project-type default. Exported so the choice is unit-testable without spawning.
 */
export async function detectVerifyCommand(root: string, repo: RepoContext): Promise<string[] | null> {
  if (repo.projectType === "node-ts" || repo.projectType === "node-js") {
    const pkg = await readPackageJson(root);
    const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
    const pm = repo.packageManagers[0] ?? "npm";
    if (scripts.test && !PLACEHOLDER_TEST.test(scripts.test)) return [pm, "run", "test"];
    if (scripts.typecheck) return [pm, "run", "typecheck"];
    if (scripts.build) return [pm, "run", "build"];
    // A TS project with a tsconfig but no scripts: a type-check is still a real check.
    if (repo.projectType === "node-ts" && repo.files.some((f) => f.path === "tsconfig.json")) {
      return ["npx", "tsc", "--noEmit"];
    }
    return null;
  }
  if (repo.projectType === "python") return ["python", "-m", "pytest", "-q"];
  if (repo.projectType === "go") return ["go", "test", "./..."];
  if (repo.projectType === "rust") return ["cargo", "test", "--quiet"];
  return null;
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * On Windows the node toolchain binaries are `.cmd` shims. Since the fix for
 * CVE-2024-27980, Node refuses to spawn a `.cmd` without a shell (it throws
 * EINVAL), so those — and only those — must run with `shell: true`. Native
 * executables (node, python, go, cargo) spawn shell-less as usual.
 */
const WIN_SHIMS = new Set(["npm", "npx", "pnpm", "yarn"]);

function resolveSpawn(cmd: string): { bin: string; shell: boolean } {
  if (process.platform === "win32" && WIN_SHIMS.has(cmd)) {
    return { bin: `${cmd}.cmd`, shell: true };
  }
  return { bin: cmd, shell: false };
}

export interface RunResult {
  code: number | null;
  output: string;
  timedOut: boolean;
}

/** Exported so callers outside this module (e.g. an install step before verification) can reuse the same Windows-`.cmd`-safe spawn logic instead of re-deriving it. */
export function runCommand(argv: string[], cwd: string, timeoutMs: number, maxOutput: number): Promise<RunResult> {
  return new Promise((resolve) => {
    const [cmd, ...args] = argv;
    let output = "";
    let timedOut = false;

    const { bin, shell } = resolveSpawn(cmd!);
    const child = spawn(bin, args, { cwd, env: process.env, shell });

    const capture = (buf: Buffer) => {
      if (output.length < maxOutput) output += buf.toString("utf8");
    };
    child.stdout?.on("data", capture);
    child.stderr?.on("data", capture);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: null, output: `${output}\n[spawn error] ${err.message}`.slice(0, maxOutput), timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output: output.slice(0, maxOutput), timedOut });
    });
  });
}

/* ------------------------------ failure parsing ----------------------------- */

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;

/**
 * Best-effort extraction of discrete failures from check output. Recognizes the
 * common shapes (tsc, vitest/jest, pytest, go, cargo) and falls back to scraping
 * error lines. Never the source of truth — the raw output rides along — but it
 * gives the human a clean list and the repair prompt a concise target set.
 */
export function parseFailures(rawOutput: string, _projectType: ProjectType): VerificationFailure[] {
  const lines = rawOutput.replace(ANSI, "").split(/\r?\n/);
  const failures: VerificationFailure[] = [];
  const seen = new Set<string>();

  const push = (label: string, detail: string, file?: string) => {
    const key = `${label}|${detail}|${file ?? ""}`;
    if (failures.length >= 25 || seen.has(key) || !label.trim()) return;
    seen.add(key);
    const f: VerificationFailure = { label: label.trim().slice(0, 200), detail: detail.trim().slice(0, 400) };
    if (file) f.file = normalizeFile(file);
    failures.push(f);
  };

  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;

    // tsc: "src/a.ts(3,5): error TS2322: msg"  or  "src/a.ts:3:5 - error TS2322: msg"
    let m =
      text.match(/^(.+?\.[cm]?tsx?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.*)$/) ??
      text.match(/^(.+?\.[cm]?tsx?):(\d+):(\d+)\s*-\s*error\s+(TS\d+):\s*(.*)$/);
    if (m) {
      push(m[4]!, m[5]!, m[1]);
      continue;
    }

    // vitest / jest: "FAIL  src/foo.test.ts > does a thing"  or  "FAIL src/foo.test.ts"
    m = text.match(/^FAIL\s+(\S+)(?:\s*>\s*(.*))?$/);
    if (m) {
      push("FAIL", m[2] ?? m[1]!, m[1]);
      continue;
    }

    // vitest/jest individual assertions: "× renders" / "✗ adds" / "✕ works"
    m = text.match(/^[×✗✕]\s+(.*)$/);
    if (m) {
      push("assertion", m[1]!);
      continue;
    }

    // pytest: "FAILED tests/test_x.py::test_y - AssertionError: msg"
    m = text.match(/^FAILED\s+(\S+?)(?:::(\S+))?\s*(?:-\s*(.*))?$/);
    if (m) {
      push(m[2] ?? "FAILED", m[3] ?? "test failed", m[1]);
      continue;
    }

    // go: "--- FAIL: TestThing (0.00s)"
    m = text.match(/^---\s*FAIL:\s*(\S+)/);
    if (m) {
      push("FAIL", m[1]!);
      continue;
    }
  }

  // Nothing matched a known shape — scrape generic error lines so we report *something*.
  if (failures.length === 0) {
    for (const line of lines) {
      const text = line.replace(ANSI, "").trim();
      if (/\b(error|Error|panic|exception)\b/.test(text) && !/^\s*at\s/.test(text)) {
        push("error", text);
        if (failures.length >= 10) break;
      }
    }
  }

  return failures;
}

function normalizeFile(file: string): string {
  return file.replace(/\\/g, "/").replace(/^\.\//, "");
}
