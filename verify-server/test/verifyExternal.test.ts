import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CommandVerifier } from "../src/core/verify/CommandVerifier";
import { redactSecrets, verifyExternalRepo } from "../src/server/verifyExternal";

let remote: string;
let work: string;
let cloneParent: string;

function git(root: string, args: string[]): void {
  execFileSync("git", args, { cwd: root, stdio: "pipe" });
}

beforeEach(async () => {
  // A real bare "remote" with one pushed branch — same pattern as test/vcs.test.ts,
  // so verifyExternalRepo is exercised against an actual `git clone`, not a mock.
  remote = await mkdtemp(path.join(tmpdir(), "consul-ve-remote-"));
  git(remote, ["init", "--bare", "-q"]);

  work = await mkdtemp(path.join(tmpdir(), "consul-ve-work-"));
  git(work, ["init", "-q"]);
  git(work, ["config", "user.email", "test@consul.local"]);
  git(work, ["config", "user.name", "Test"]);
  await writeFile(path.join(work, "package.json"), JSON.stringify({ name: "demo", scripts: {} }));
  git(work, ["add", "-A"]);
  git(work, ["commit", "-q", "-m", "init"]);
  git(work, ["branch", "-M", "feature/verify-me"]);
  git(work, ["remote", "add", "origin", remote]);
  git(work, ["push", "-q", "origin", "feature/verify-me"]);

  cloneParent = await mkdtemp(path.join(tmpdir(), "consul-ve-clone-"));
});

afterEach(async () => {
  await rm(remote, { recursive: true, force: true });
  await rm(work, { recursive: true, force: true });
  await rm(cloneParent, { recursive: true, force: true });
});

describe("verifyExternalRepo", () => {
  it("clones the branch and reports a pass from the injected verifier", async () => {
    const cloneDir = path.join(cloneParent, "clone");
    const outcome = await verifyExternalRepo({
      cloneUrl: remote,
      branch: "feature/verify-me",
      cloneDir,
      skipInstall: true,
      verifier: new CommandVerifier({ command: ["node", "-e", "process.exit(0)"] }),
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.ran).toBe(true);
      expect(outcome.result.passed).toBe(true);
    }
  });

  it("reports a fail with the real captured output when the check exits non-zero", async () => {
    const cloneDir = path.join(cloneParent, "clone");
    const outcome = await verifyExternalRepo({
      cloneUrl: remote,
      branch: "feature/verify-me",
      cloneDir,
      skipInstall: true,
      verifier: new CommandVerifier({ command: ["node", "-e", "console.error('boom'); process.exit(1)"] }),
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.passed).toBe(false);
      expect(outcome.result.output).toContain("boom");
    }
  });

  it("cleans up the clone directory whether verification passes or fails", async () => {
    const cloneDir = path.join(cloneParent, "clone");
    await verifyExternalRepo({
      cloneUrl: remote,
      branch: "feature/verify-me",
      cloneDir,
      skipInstall: true,
      verifier: new CommandVerifier({ command: ["node", "-e", "process.exit(1)"] }),
    });
    await expect(stat(cloneDir)).rejects.toThrow();
  });

  it("reports a clean failure (not a throw) for a branch that does not exist, and still cleans up", async () => {
    const cloneDir = path.join(cloneParent, "clone");
    const outcome = await verifyExternalRepo({
      cloneUrl: remote,
      branch: "does-not-exist",
      cloneDir,
      skipInstall: true,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatch(/clone failed/i);
    await expect(stat(cloneDir)).rejects.toThrow();
  });
});

describe("redactSecrets", () => {
  it("replaces every occurrence of each secret with a placeholder", () => {
    const text = "clone https://x:s3cr3t@host/repo.git failed, url was https://x:s3cr3t@host/repo.git";
    expect(redactSecrets(text, ["s3cr3t"])).toBe(
      "clone https://x:***@host/repo.git failed, url was https://x:***@host/repo.git",
    );
  });

  it("returns the text unchanged when there is nothing to redact", () => {
    expect(redactSecrets("plain error", [])).toBe("plain error");
    expect(redactSecrets("plain error")).toBe("plain error");
  });
});
