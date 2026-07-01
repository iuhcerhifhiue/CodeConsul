import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);

export interface GitResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

/** Shared by every git invocation in this module — normalizes a thrown exec error into a {@link GitResult} instead of letting callers deal with raw exceptions. */
async function execGit(args: string[], cwd?: string): Promise<GitResult> {
  try {
    const { stdout, stderr } = await pexec("git", args, { cwd, windowsHide: true });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      ok: false,
      stdout: e.stdout?.toString().trim() ?? "",
      stderr: e.stderr?.toString().trim() || String(err),
    };
  }
}

/**
 * A thin, promise-based wrapper over the `git` CLI, scoped to one repo root.
 * Every call returns a {@link GitResult} instead of throwing, so the Publisher
 * can treat a failed push (e.g. a suspended account) as a recorded step rather
 * than a crash — local branch/commit work still completes.
 */
export class GitRepo {
  constructor(public readonly root: string) {}

  private run(args: string[]): Promise<GitResult> {
    return execGit(args, this.root);
  }

  async isRepo(): Promise<boolean> {
    return (await this.run(["rev-parse", "--is-inside-work-tree"])).ok;
  }

  async currentBranch(): Promise<string | null> {
    const r = await this.run(["rev-parse", "--abbrev-ref", "HEAD"]);
    return r.ok ? r.stdout : null;
  }

  async createBranch(name: string): Promise<GitResult> {
    return this.run(["checkout", "-b", name]);
  }

  async stageAll(): Promise<GitResult> {
    return this.run(["add", "-A"]);
  }

  /** True when there is something staged to commit (`git diff --cached --quiet` exits non-zero). */
  async hasStagedChanges(): Promise<boolean> {
    return !(await this.run(["diff", "--cached", "--quiet"])).ok;
  }

  async commit(message: string): Promise<GitResult> {
    return this.run(["commit", "-m", message]);
  }

  async push(remote: string, branch: string): Promise<GitResult> {
    return this.run(["push", "-u", remote, branch]);
  }

  async getRemoteUrl(remote = "origin"): Promise<string | null> {
    const r = await this.run(["remote", "get-url", remote]);
    return r.ok && r.stdout ? r.stdout : null;
  }

  async getConfig(key: string): Promise<string | null> {
    const r = await this.run(["config", "--get", key]);
    return r.ok && r.stdout ? r.stdout : null;
  }

  async setLocalConfig(key: string, value: string): Promise<GitResult> {
    return this.run(["config", key, value]);
  }

  async headSha(): Promise<string | null> {
    const r = await this.run(["rev-parse", "HEAD"]);
    return r.ok ? r.stdout : null;
  }
}

export interface CloneOptions {
  branch?: string;
  /** Shallow-clone to this depth (e.g. 1). Omit for a full clone. */
  depth?: number;
}

/**
 * Clone `url` into `dir` (which must not already exist, or must be empty). This is
 * the seam that lets the engine operate on a repo it doesn't have on disk yet —
 * everything downstream (`Workspace`, `CommandVerifier`, `GitRepo`) already assumes
 * the repo is a local checkout; this is what makes that true for an arbitrary
 * external repo+branch.
 */
export async function cloneRepo(url: string, dir: string, opts: CloneOptions = {}): Promise<GitResult> {
  const args = ["clone"];
  if (opts.depth !== undefined) args.push("--depth", String(opts.depth));
  if (opts.branch) args.push("--branch", opts.branch);
  args.push(url, dir);
  return execGit(args);
}

/** Extract `{owner, repo}` from an https or ssh GitHub remote URL, or null. */
export function parseGitHubSlug(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!m) return null;
  return { owner: m[1]!, repo: m[2]! };
}
