import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a242ab8748831bf367aed86';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the user's OAuth token — works for both public and private repos
    let accessToken;
    let headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Consul-Oikos' };
    try {
      const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = connection.accessToken;
      headers['Authorization'] = `token ${accessToken}`;
    } catch {
      // No connection — will only be able to access public repos unauthenticated
    }

    const body = await req.json();
    const { repo_full_name } = body;
    if (!repo_full_name) return Response.json({ error: 'repo_full_name is required' }, { status: 400 });

    const [owner, repo] = repo_full_name.split('/');

    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
      const text = await repoResponse.text();
      let msg = 'Repository not found. Check the URL and make sure you have access.';
      try { msg = JSON.parse(text).message || msg; } catch {}
      return Response.json({ error: msg }, { status: repoResponse.status });
    }
    const repoInfo = await repoResponse.json();
    const defaultBranch = repoInfo.default_branch;

    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
    if (!treeResponse.ok) return Response.json({ error: 'Failed to fetch file tree' }, { status: treeResponse.status });
    const treeData = await treeResponse.json();

    const ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache', 'vendor', 'target', '.venv', 'coverage'];
    const filePaths = treeData.tree
      .filter((item) => item.type === 'blob')
      .filter((item) => !ignorePatterns.some((p) => item.path.startsWith(p + '/') || item.path === p))
      .map((item) => item.path);

    const fileTree = filePaths.join('\n');

    const keyFileNames = [
      'package.json', 'tsconfig.json', 'Cargo.toml', 'go.mod', 'requirements.txt',
      'pyproject.toml', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json',
      'README.md', 'readme.md', 'docker-compose.yml', 'Dockerfile',
      'next.config.js', 'next.config.mjs', 'vite.config.js', 'vite.config.ts',
      'webpack.config.js', 'tailwind.config.js', 'tailwind.config.ts',
    ];

    const filesToFetch = filePaths
      .filter((path) => keyFileNames.includes(path) || keyFileNames.includes(path.split('/').pop()))
      .slice(0, 8);

    const keyFiles = {};
    for (const path of filesToFetch) {
      try {
        const contentResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${defaultBranch}`, { headers });
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          if (contentData.encoding === 'base64') {
            const binary = atob(contentData.content.replace(/\n/g, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const decoded = new TextDecoder().decode(bytes);
            keyFiles[path] = decoded.length > 3000 ? decoded.substring(0, 3000) + '\n... (truncated)' : decoded;
          }
        }
      } catch {}
    }

    let stack = 'Unknown';
    if (keyFiles['package.json']) {
      try {
        const pkg = JSON.parse(keyFiles['package.json']);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const parts = [];
        if (deps['next']) parts.push('Next.js');
        if (deps['react'] && !deps['next']) parts.push('React');
        if (deps['vue']) parts.push('Vue');
        if (deps['express']) parts.push('Express');
        if (deps['fastify']) parts.push('Fastify');
        if (deps['@nestjs/core']) parts.push('NestJS');
        if (deps['tailwindcss']) parts.push('Tailwind');
        if (deps['typescript'] || deps['@types/node']) parts.push('TypeScript');
        if (deps['prisma']) parts.push('Prisma');
        if (deps['mongoose']) parts.push('MongoDB');
        if (deps['drizzle-orm']) parts.push('Drizzle');
        if (deps['socket.io']) parts.push('Socket.io');
        stack = parts.length > 0 ? parts.join(', ') : 'Node.js';
      } catch {}
    } else if (keyFiles['go.mod']) stack = 'Go';
    else if (keyFiles['Cargo.toml']) stack = 'Rust';
    else if (keyFiles['requirements.txt'] || keyFiles['pyproject.toml']) stack = 'Python';
    else if (keyFiles['Gemfile']) stack = 'Ruby';
    else if (keyFiles['pom.xml'] || keyFiles['build.gradle']) stack = 'Java';

    return Response.json({
      file_tree: fileTree.substring(0, 10000),
      key_files: keyFiles,
      stack,
      default_branch: defaultBranch,
      file_count: filePaths.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});