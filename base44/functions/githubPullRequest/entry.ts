import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = Deno.env.get('GITHUB_TOKEN');
    if (!accessToken) return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });

    const headers = {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Consul-Oikos',
      'Content-Type': 'application/json',
    };

    const body = await req.json();
    const { operation, repo_full_name, branch, base, title, pr_body } = body;

    if (!repo_full_name) return Response.json({ error: 'repo_full_name is required' }, { status: 400 });
    const [owner, repo] = repo_full_name.split('/');

    const safeError = async (res, fallback) => {
      const text = await res.text();
      let msg = fallback;
      try { msg = JSON.parse(text).message || msg; } catch { if (text) msg = text.substring(0, 300); }
      return Response.json({ error: msg, status: res.status }, { status: res.status });
    };

    // Resolve the repo's default branch (used as the base when none is given).
    const getDefaultBranch = async () => {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!res.ok) return null;
      return (await res.json()).default_branch;
    };

    // ensure_branch: create `branch` off `base` (default branch) if it does not already exist.
    // This must run before specialists write with { branch }, since the GitHub Contents API
    // will not auto-create a missing branch.
    if (operation === 'ensure_branch') {
      if (!branch) return Response.json({ error: 'branch is required' }, { status: 400 });
      const baseBranch = base || (await getDefaultBranch());
      if (!baseBranch) return Response.json({ error: 'Could not resolve base branch' }, { status: 404 });

      // Already exists? Report it and stop — idempotent.
      const existing = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
      if (existing.ok) {
        return Response.json({ branch, base: baseBranch, created: false, already_exists: true });
      }

      const baseRef = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers });
      if (!baseRef.ok) return safeError(baseRef, 'Base branch not found');
      const baseSha = (await baseRef.json()).object?.sha;

      const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
      });
      if (!createRes.ok) return safeError(createRes, 'Failed to create branch');
      return Response.json({ branch, base: baseBranch, created: true, sha: baseSha });
    }

    // open: open a pull request from `branch` into `base` (default branch).
    if (operation === 'open') {
      if (!branch) return Response.json({ error: 'branch (head) is required' }, { status: 400 });
      const baseBranch = base || (await getDefaultBranch());
      if (!baseBranch) return Response.json({ error: 'Could not resolve base branch' }, { status: 404 });

      // Reuse an existing open PR for this head instead of erroring on duplicates.
      const existing = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${branch}`,
        { headers },
      );
      if (existing.ok) {
        const list = await existing.json();
        if (Array.isArray(list) && list.length > 0) {
          return Response.json({ number: list[0].number, url: list[0].html_url, branch, base: baseBranch, reused: true });
        }
      }

      const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title || `Consul: ${branch}`,
          head: branch,
          base: baseBranch,
          body: pr_body || 'Automated changes from the Consul multi-agent platform. Review before merging.',
        }),
      });
      if (!createRes.ok) return safeError(createRes, 'Failed to open pull request');
      const pr = await createRes.json();
      return Response.json({ number: pr.number, url: pr.html_url, branch, base: baseBranch, reused: false });
    }

    return Response.json({ error: 'Unknown operation. Use ensure_branch or open.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
