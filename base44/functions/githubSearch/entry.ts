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
    };

    const body = await req.json();
    const { repo_full_name, query, mode = 'auto', path_prefix, branch } = body;
    const maxResults = Math.min(body.max_results || 30, 100);

    if (!repo_full_name || !query) {
      return Response.json({ error: 'repo_full_name and query are required' }, { status: 400 });
    }
    const [owner, repo] = repo_full_name.split('/');
    const q = String(query).toLowerCase();

    const results = new Map(); // path -> { path, matched_by[] }
    const add = (path, by) => {
      if (!results.has(path)) results.set(path, { path, matched_by: [] });
      if (!results.get(path).matched_by.includes(by)) results.get(path).matched_by.push(by);
    };

    // Filename search over the git tree — cheap, reliable, works on any branch.
    if (mode === 'auto' || mode === 'filename') {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoRes.ok) return Response.json({ error: 'Repository not found or not accessible.' }, { status: repoRes.status });
      const ref = branch || (await repoRes.json()).default_branch;

      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`, { headers });
      if (treeRes.ok) {
        const tree = await treeRes.json();
        const ignore = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', 'vendor/', 'target/', 'coverage/'];
        for (const item of tree.tree || []) {
          if (item.type !== 'blob') continue;
          if (ignore.some((p) => item.path.startsWith(p))) continue;
          if (path_prefix && !item.path.startsWith(path_prefix)) continue;
          if (item.path.toLowerCase().includes(q)) add(item.path, 'filename');
        }
      }
    }

    // Content search via GitHub's code search index. Best-effort: only indexes the
    // default branch and can lag or miss on small/new repos, so failures degrade
    // gracefully rather than erroring the whole call.
    if (mode === 'auto' || mode === 'content') {
      try {
        const codeQ = encodeURIComponent(`${query} repo:${repo_full_name}${path_prefix ? ` path:${path_prefix}` : ''}`);
        const codeRes = await fetch(`https://api.github.com/search/code?q=${codeQ}&per_page=${maxResults}`, {
          headers: { ...headers, 'Accept': 'application/vnd.github.text-match+json' },
        });
        if (codeRes.ok) {
          const data = await codeRes.json();
          for (const item of data.items || []) add(item.path, 'content');
        }
      } catch { /* ignore content-search failures */ }
    }

    const matches = Array.from(results.values()).slice(0, maxResults);
    return Response.json({
      query,
      mode,
      match_count: matches.length,
      matches,
      note: matches.length === 0
        ? 'No matches. Content search only indexes the default branch and may miss new repos — try a filename query or read files directly.'
        : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
