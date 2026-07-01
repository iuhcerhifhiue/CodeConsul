import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChangeSet, FileChange } from "../changes/types";
import { isUnsafePath } from "../changes/types";

export type ProjectType =
  | "node-ts"
  | "node-js"
  | "python"
  | "go"
  | "rust"
  | "unknown"
  | "empty";

export interface RepoFile {
  /** Repo-relative, POSIX-style path. */
  path: string;
  ext: string;
  size: number;
}

/**
 * A deterministic, LLM-free model of a repository. This is the context the
 * Architect reasons over. Everything here is derived by reading the filesystem —
 * no keys, no network — which is what lets Consul produce a real plan offline and
 * lets a future ClaudeProvider *enrich* rather than *replace* the analysis.
 */
export interface RepoContext {
  root: string;
  isEmpty: boolean;
  files: RepoFile[];
  fileCount: number;
  /** Extension -> file count, for code-bearing files only. */
  languages: Record<string, number>;
  primaryLanguage: string | null;
  projectType: ProjectType;
  frameworks: string[];
  packageManagers: string[];
  entryPoints: string[];
  hasTests: boolean;
  /** Detected source root ("src", "lib", or null if code lives at the root). */
  srcDir: string | null;
  /** Detected test root ("test", "tests", "__tests__", or null). */
  testDir: string | null;
  /** Short stable hash of the repo's shape — lets a Plan record what it was built against. */
  signature: string;
  /** One-line human summary, e.g. "node-ts project, 42 files, frameworks: express, vitest". */
  summary: string;
}

export interface WorkspaceOptions {
  /** Directories never descended into. */
  ignoreDirs?: string[];
  maxFiles?: number;
  maxDepth?: number;
}

export interface ApplyResult {
  applied: string[];
  skipped: Array<{ path: string; reason: string }>;
  dryRun: boolean;
}

const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  "coverage",
  ".turbo",
  ".cache",
  "vendor",
  "target",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
]);

const CODE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".rb", ".php", ".cs",
  ".vue", ".svelte", ".css", ".scss",
]);

const FRAMEWORK_DEPS: Record<string, string> = {
  react: "react",
  next: "next",
  vue: "vue",
  svelte: "svelte",
  "@angular/core": "angular",
  express: "express",
  fastify: "fastify",
  koa: "koa",
  "@nestjs/core": "nestjs",
  vitest: "vitest",
  jest: "jest",
  mocha: "mocha",
  prisma: "prisma",
  tailwindcss: "tailwind",
  zod: "zod",
};

/**
 * Reads a directory tree and distills it into a {@link RepoContext}. In Phase 1
 * the "GitHub connection" is simply a local clone the Workspace points at; the
 * scanning logic is identical regardless of how the repo got to disk.
 */
export class Workspace {
  private readonly ignore: Set<string>;
  private readonly maxFiles: number;
  private readonly maxDepth: number;

  constructor(
    public readonly root: string,
    opts: WorkspaceOptions = {},
  ) {
    this.ignore = new Set([...DEFAULT_IGNORE, ...(opts.ignoreDirs ?? [])]);
    this.maxFiles = opts.maxFiles ?? 5000;
    this.maxDepth = opts.maxDepth ?? 12;
  }

  async scan(): Promise<RepoContext> {
    const files: RepoFile[] = [];
    await this.walk(this.root, 0, files);

    const isEmpty = files.length === 0;
    const languages = this.countLanguages(files);
    const primaryLanguage = this.pickPrimaryLanguage(languages);
    const pkg = await this.readPackageJson();
    const projectType = this.detectProjectType(files, pkg);
    const frameworks = this.detectFrameworks(pkg, files);
    const packageManagers = this.detectPackageManagers(files);
    const srcDir = this.detectDir(files, ["src", "lib", "app"]);
    const testDir = this.detectDir(files, ["test", "tests", "__tests__", "spec"]);
    const hasTests = testDir !== null || files.some((f) => /\.(test|spec)\./.test(f.path));
    const entryPoints = this.detectEntryPoints(files, projectType, srcDir);
    const signature = this.computeSignature(files, projectType);

    const summary = isEmpty
      ? "empty repository (no files yet)"
      : `${projectType} project, ${files.length} files` +
        (primaryLanguage ? `, primary ${primaryLanguage}` : "") +
        (frameworks.length ? `, frameworks: ${frameworks.join(", ")}` : "");

    return {
      root: this.root,
      isEmpty,
      files,
      fileCount: files.length,
      languages,
      primaryLanguage,
      projectType,
      frameworks,
      packageManagers,
      entryPoints,
      hasTests,
      srcDir,
      testDir,
      signature,
      summary,
    };
  }

  private async walk(dir: string, depth: number, out: RepoFile[]): Promise<void> {
    if (depth > this.maxDepth || out.length >= this.maxFiles) return;

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable directory — skip rather than crash the scan
    }

    for (const entry of entries) {
      if (out.length >= this.maxFiles) return;
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (this.ignore.has(entry.name)) continue;
        await this.walk(full, depth + 1, out);
      } else if (entry.isFile()) {
        let size = 0;
        try {
          size = (await fs.stat(full)).size;
        } catch {
          /* ignore stat failures */
        }
        out.push({
          path: this.rel(full),
          ext: path.extname(entry.name).toLowerCase(),
          size,
        });
      }
    }
  }

  private rel(full: string): string {
    return path.relative(this.root, full).split(path.sep).join("/");
  }

  private countLanguages(files: RepoFile[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const f of files) {
      if (!CODE_EXTS.has(f.ext)) continue;
      counts[f.ext] = (counts[f.ext] ?? 0) + 1;
    }
    return counts;
  }

  private pickPrimaryLanguage(languages: Record<string, number>): string | null {
    let best: string | null = null;
    let bestCount = 0;
    for (const [ext, count] of Object.entries(languages)) {
      if (count > bestCount) {
        best = ext;
        bestCount = count;
      }
    }
    return best;
  }

  private async readPackageJson(): Promise<Record<string, unknown> | null> {
    try {
      const raw = await fs.readFile(path.join(this.root, "package.json"), "utf8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private detectProjectType(files: RepoFile[], pkg: Record<string, unknown> | null): ProjectType {
    if (files.length === 0) return "empty";
    const has = (name: string) => files.some((f) => f.path === name || f.path.endsWith(`/${name}`));
    if (pkg) {
      const usesTs = files.some((f) => f.ext === ".ts" || f.ext === ".tsx") || has("tsconfig.json");
      return usesTs ? "node-ts" : "node-js";
    }
    if (has("pyproject.toml") || has("requirements.txt") || has("setup.py")) return "python";
    if (has("go.mod")) return "go";
    if (has("Cargo.toml")) return "rust";
    return "unknown";
  }

  private detectFrameworks(pkg: Record<string, unknown> | null, files: RepoFile[]): string[] {
    const found = new Set<string>();
    if (pkg) {
      const deps = {
        ...(pkg.dependencies as Record<string, string> | undefined),
        ...(pkg.devDependencies as Record<string, string> | undefined),
      };
      for (const dep of Object.keys(deps)) {
        const label = FRAMEWORK_DEPS[dep];
        if (label) found.add(label);
      }
    }
    if (files.some((f) => f.path.endsWith("tailwind.config.js") || f.path.endsWith("tailwind.config.ts"))) {
      found.add("tailwind");
    }
    return [...found].sort();
  }

  private detectPackageManagers(files: RepoFile[]): string[] {
    const managers: string[] = [];
    const has = (name: string) => files.some((f) => f.path === name);
    if (has("package-lock.json")) managers.push("npm");
    if (has("pnpm-lock.yaml")) managers.push("pnpm");
    if (has("yarn.lock")) managers.push("yarn");
    if (has("bun.lockb")) managers.push("bun");
    return managers;
  }

  private detectDir(files: RepoFile[], candidates: string[]): string | null {
    for (const candidate of candidates) {
      if (files.some((f) => f.path === candidate || f.path.startsWith(`${candidate}/`))) {
        return candidate;
      }
    }
    return null;
  }

  private detectEntryPoints(
    files: RepoFile[],
    projectType: ProjectType,
    srcDir: string | null,
  ): string[] {
    const candidates =
      projectType === "python"
        ? ["main.py", "app.py", "__main__.py", "manage.py"]
        : projectType === "go"
          ? ["main.go", "cmd/main.go"]
          : projectType === "rust"
            ? ["src/main.rs", "src/lib.rs"]
            : [
                `${srcDir ?? "src"}/index.ts`,
                `${srcDir ?? "src"}/main.ts`,
                `${srcDir ?? "src"}/index.js`,
                "index.ts",
                "index.js",
                "server.ts",
                "server.js",
              ];
    const present = new Set(files.map((f) => f.path));
    return candidates.filter((c) => present.has(c));
  }

  private computeSignature(files: RepoFile[], projectType: ProjectType): string {
    const top = new Set<string>();
    for (const f of files) {
      const head = f.path.split("/")[0] ?? f.path;
      top.add(head);
    }
    const material = `${projectType}|${files.length}|${[...top].sort().join(",")}`;
    return createHash("sha1").update(material).digest("hex").slice(0, 12);
  }

  /* ----------------------------- write side ------------------------------ */

  /** Read a repo-relative file as UTF-8, or null if it does not exist. */
  async readFile(relPath: string): Promise<string | null> {
    try {
      return await fs.readFile(path.join(this.root, relPath), "utf8");
    } catch {
      return null;
    }
  }

  /**
   * Apply a ChangeSet to disk. Every path is re-checked against the repo root —
   * a hard security boundary, independent of whatever the executor claimed.
   * Pass `{ dryRun: true }` to compute the result without writing anything.
   */
  async applyChangeSet(cs: ChangeSet, opts: { dryRun?: boolean } = {}): Promise<ApplyResult> {
    const dryRun = opts.dryRun ?? false;
    const applied: string[] = [];
    const skipped: Array<{ path: string; reason: string }> = [];

    for (const change of cs.changes) {
      const res = await this.applyChange(change, dryRun);
      if (res.ok) applied.push(change.path);
      else skipped.push({ path: change.path, reason: res.reason });
    }
    return { applied, skipped, dryRun };
  }

  private async applyChange(
    change: FileChange,
    dryRun: boolean,
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (isUnsafePath(change.path)) return { ok: false, reason: "unsafe path" };

    const full = path.resolve(this.root, change.path);
    const root = path.resolve(this.root);
    if (full !== root && !full.startsWith(root + path.sep)) {
      return { ok: false, reason: "path escapes repo root" };
    }
    if (dryRun) return { ok: true };

    try {
      if (change.op === "delete") {
        await fs.rm(full, { force: true });
      } else {
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, change.contents ?? "", "utf8");
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : String(err) };
    }
  }
}
