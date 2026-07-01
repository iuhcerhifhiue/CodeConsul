# CodeConsul verify server

The piece of the [Consul](https://github.com/) engine that CodeConsul needs and
Base44 structurally can't provide: **real verification**. Base44's serverless
functions can't `git clone`, `npm install`, or spawn a test process — so this is a
small standalone Node service that does exactly that, and nothing else.

## What it does

`POST /api/verify-external` with `{ "repo_full_name": "owner/repo", "branch": "..." }`:

1. Clones that branch into a throwaway directory (shallow, token-authenticated).
2. Installs dependencies (`npm install`, for Node projects).
3. Runs the repo's **own** check command — its `test` script, else `typecheck`,
   else `build`, else a language default (`pytest` / `go test` / `cargo test`).
4. Returns structured `{ ran, passed, failures[], output, summary, ... }`.
5. Deletes the clone, always — pass, fail, or crash.

`GET /health` → `{ ok: true }` for deploy-platform health probes.

## How CodeConsul uses it

The Base44 function `base44/functions/verifyBranch/entry.ts` calls this endpoint
after the specialist agents finish, before the PR is opened. It's wired via two
Base44 environment variables:

- `CONSUL_VERIFY_URL` — the deployed URL of this server.
- `CONSUL_VERIFY_SECRET` — optional shared secret; when set here (as an env var on
  this server) and in Base44, requests must carry a matching `X-Consul-Secret`
  header. **Set it in production** — this endpoint runs arbitrary repo-defined
  scripts and must not be openly callable.

This server also needs `GITHUB_TOKEN` in its own environment to clone private repos.

## Run it

```bash
npm install
GITHUB_TOKEN=ghp_... CONSUL_VERIFY_SECRET=$(openssl rand -hex 16) npm start
# → http://localhost:8787
npm test        # standalone test of the clone → verify → cleanup path
npm run typecheck
```

## Provenance

Everything under `src/core/` is vendored **verbatim** from the Consul project's
engine (`src/core/{vcs,verify,workspace,changes,plan,review}`) so CodeConsul is
self-contained and has no dependency on the separate Consul repo. `src/server/
verifyExternal.ts` is likewise from Consul. Only `src/server/server.ts` (a
verify-only HTTP wrapper — Consul's own server also drives its build/orchestrate
engine, which CodeConsul does not need) is bespoke to this directory. To re-sync
after an engine change upstream, re-copy those files; they have no local edits.

## Known limitation

It executes whatever `install` / `test` / `build` scripts the target repo defines —
that's the point, but it means running repo-controlled code. Fine for your own
connected repos (an already-implicit trust level — Base44 functions act on these
repos directly today). It is **not** a hardened multi-tenant sandbox; running it
against untrusted repos would want per-run containerization, which this does not do.
