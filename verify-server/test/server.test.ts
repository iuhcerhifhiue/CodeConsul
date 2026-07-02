import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server/app";

/**
 * Exercise the HTTP guard paths (health + input/auth validation) against a real
 * listening instance on an ephemeral port. The clone/install/verify path itself is
 * covered by verifyExternal.test.ts; these tests deliberately never reach it, so
 * they need no network, no token, and no real repo.
 */
async function withServer<T>(fn: (base: string) => Promise<T>): Promise<T> {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const post = (base: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}/api/verify-external`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

// Handlers read env per-request; save and restore so tests don't leak into each other.
const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
});

describe("verify-server HTTP", () => {
  it("GET /health returns ok", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/health`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, service: "codeconsul-verify" });
    });
  });

  it("400 when repo_full_name / branch are missing", async () => {
    delete process.env.CONSUL_VERIFY_SECRET;
    process.env.GITHUB_TOKEN = "t";
    await withServer(async (base) => {
      const res = await post(base, {});
      expect(res.status).toBe(400);
      expect(((await res.json()) as { error?: string }).error).toMatch(/required/i);
    });
  });

  it("401 when a secret is configured and the header does not match", async () => {
    process.env.CONSUL_VERIFY_SECRET = "s3cr3t";
    process.env.GITHUB_TOKEN = "t";
    await withServer(async (base) => {
      const res = await post(base, { repo_full_name: "o/r", branch: "main" }, { "X-Consul-Secret": "wrong" });
      expect(res.status).toBe(401);
    });
  });

  it("passes the secret check when the header matches (then fails later for a real reason)", async () => {
    process.env.CONSUL_VERIFY_SECRET = "s3cr3t";
    delete process.env.GITHUB_TOKEN; // so it stops at the token check, not the secret check
    await withServer(async (base) => {
      const res = await post(base, { repo_full_name: "o/r", branch: "main" }, { "X-Consul-Secret": "s3cr3t" });
      expect(res.status).toBe(500);
      expect(((await res.json()) as { error?: string }).error).toMatch(/GITHUB_TOKEN/);
    });
  });

  it("500 when GITHUB_TOKEN is not configured", async () => {
    delete process.env.CONSUL_VERIFY_SECRET;
    delete process.env.GITHUB_TOKEN;
    await withServer(async (base) => {
      const res = await post(base, { repo_full_name: "o/r", branch: "main" });
      expect(res.status).toBe(500);
      expect(((await res.json()) as { error?: string }).error).toMatch(/GITHUB_TOKEN/);
    });
  });
});
