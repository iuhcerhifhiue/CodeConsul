import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import type { Express, Request, Response } from "express";
import { verifyExternalRepo } from "./verifyExternal";

/**
 * CodeConsul's verification service.
 *
 * A tiny, single-purpose HTTP server: given a repo + branch, it clones the branch,
 * installs dependencies, runs the repo's *real* test/typecheck/build command, and
 * reports pass/fail with parsed failures. This is the execution step Base44's
 * serverless functions can't do (no persistent disk, no `git clone`/`npm install`),
 * so CodeConsul's `verifyBranch` Base44 function calls out to this instead.
 *
 * The verification engine under src/core is vendored verbatim from the Consul
 * project (see README) — this app + its entry point (server.ts) are the only
 * bespoke parts. Kept separate from `listen()` so the routes are testable without
 * binding a port.
 */
const WORKSPACES = path.join(tmpdir(), "codeconsul-verify");

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  /** Liveness check for deploy platforms (Fly/Render/Railway health probes). */
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "codeconsul-verify" });
  });

  /**
   * Verify an external repo+branch on demand. Requires a shared secret (when one is
   * configured) because it executes arbitrary repo-defined scripts on the server, so
   * it must not be openly callable. Clones with a short-lived, token-authenticated URL
   * and redacts that token from any error text it returns. Env is read per-request so
   * the process can be reconfigured (and tested) without a restart.
   */
  app.post("/api/verify-external", async (req: Request, res: Response) => {
    const secret = process.env.CONSUL_VERIFY_SECRET;
    if (secret && req.headers["x-consul-secret"] !== secret) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const repoFullName = String(req.body?.repo_full_name ?? "").trim();
    const branch = String(req.body?.branch ?? "").trim();
    const token = process.env.GITHUB_TOKEN;
    if (!repoFullName || !branch) {
      res.status(400).json({ error: "repo_full_name and branch are required" });
      return;
    }
    if (!token) {
      res.status(500).json({ error: "GITHUB_TOKEN not configured" });
      return;
    }

    const cloneDir = path.join(WORKSPACES, `verify-${randomUUID()}`);
    const cloneUrl = `https://x-access-token:${token}@github.com/${repoFullName}.git`;

    const outcome = await verifyExternalRepo({ cloneUrl, branch, cloneDir, redactSecrets: [token] });
    if (!outcome.ok) {
      res.status(422).json({ error: outcome.error });
      return;
    }
    res.json(outcome.result);
  });

  return app;
}
