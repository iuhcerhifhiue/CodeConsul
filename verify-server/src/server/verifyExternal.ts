import { promises as fs } from "node:fs";
import { cloneRepo } from "../core/vcs/git";
import { CommandVerifier, runCommand } from "../core/verify/CommandVerifier";
import { Workspace } from "../core/workspace/Workspace";
import type { RepoContext } from "../core/workspace/Workspace";
import type { Verifier, VerificationResult } from "../core/verify/types";

export interface VerifyExternalRequest {
  /** Full clone URL, credentials embedded if needed (e.g. an authenticated HTTPS URL). */
  cloneUrl: string;
  branch: string;
  /** Absolute path for the disposable clone. Removed unconditionally when this returns. */
  cloneDir: string;
  /** Substrings (e.g. an embedded token) stripped from any returned error text. */
  redactSecrets?: string[];
  /** Override the verifier used — the escape hatch for tests, same pattern as {@link CommandVerifier}'s own `command` option. */
  verifier?: Verifier;
  /** Skip the dependency-install step — tests don't want a real `npm install`. */
  skipInstall?: boolean;
}

export type VerifyExternalResult =
  | { ok: true; result: VerificationResult }
  | { ok: false; error: string };

/**
 * Clones `branch` of `cloneUrl` into a disposable directory, installs dependencies,
 * runs the repo's real verification command, and always cleans up the clone —
 * regardless of outcome. This is the "execution sandbox" seam CodeConsul calls into;
 * `CommandVerifier` and `Workspace` are unmodified Consul engine code, reused as-is.
 *
 * Unlike Consul's own CLI usage (which runs against a working directory that
 * already has dependencies installed, or a freshly-scaffolded minimal project), an
 * arbitrary external repo needs `npm install` before its own test/build script will
 * run at all — hence the install step, which Consul's own build/ship path never
 * needed.
 */
export async function verifyExternalRepo(req: VerifyExternalRequest): Promise<VerifyExternalResult> {
  try {
    const clone = await cloneRepo(req.cloneUrl, req.cloneDir, { branch: req.branch, depth: 1, timeoutMs: 120_000 });
    if (!clone.ok) {
      const detail = clone.stderr || clone.stdout || "unknown error";
      return { ok: false, error: `clone failed: ${redactSecrets(detail, req.redactSecrets)}` };
    }

    const workspace = new Workspace(req.cloneDir);
    const repo = await workspace.scan();

    if (!req.skipInstall) {
      const install = await installDependencies(req.cloneDir, repo);
      if (install && !install.ok) {
        return { ok: false, error: `dependency install failed: ${redactSecrets(install.output, req.redactSecrets)}` };
      }
    }

    const verifier = req.verifier ?? new CommandVerifier();
    const result = await verifier.verify({ root: req.cloneDir, repo });
    return { ok: true, result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: redactSecrets(msg, req.redactSecrets) };
  } finally {
    await fs.rm(req.cloneDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Node-ecosystem only for v1: python/go/rust dependency resolution (venvs, module
 * fetch, cargo fetch) varies enough that it needs its own design, and CodeConsul's
 * own stack detection already skews heavily toward JS/TS projects.
 */
async function installDependencies(
  root: string,
  repo: RepoContext,
): Promise<{ ok: boolean; output: string } | null> {
  if (repo.projectType !== "node-ts" && repo.projectType !== "node-js") return null;

  const pm = repo.packageManagers[0] ?? "npm";
  const argv = pm === "npm" ? ["npm", "install", "--no-audit", "--no-fund"] : [pm, "install"];
  const r = await runCommand(argv, root, 5 * 60_000, 20_000);
  return { ok: r.code === 0 && !r.timedOut, output: r.output };
}

export function redactSecrets(text: string, secrets: string[] = []): string {
  return secrets.filter(Boolean).reduce((t, s) => t.split(s).join("***"), text);
}
