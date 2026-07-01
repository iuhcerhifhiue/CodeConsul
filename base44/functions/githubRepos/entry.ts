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

    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50&type=all', { headers });
    if (!response.ok) return Response.json({ error: 'Failed to fetch repositories' }, { status: response.status });

    const data = await response.json();
    const repos = data.map((repo) => ({
      name: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      updated_at: repo.updated_at,
    }));

    return Response.json({ repos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});