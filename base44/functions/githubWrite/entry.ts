import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a242ab8748831bf367aed86';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken;
    try {
      const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = connection.accessToken;
    } catch {
      return Response.json({ error: 'GITHUB_NOT_CONNECTED', message: 'Connect your GitHub account first' }, { status: 403 });
    }

    const body = await req.json();
    const { operation, repo_full_name, file_path, content, commit_message, branch } = body;

    if (!repo_full_name || !file_path) {
      return Response.json({ error: 'repo_full_name and file_path are required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Consul-Oikos',
    };

    const [owner, repo] = repo_full_name.split('/');
    const refParam = branch ? `?ref=${branch}` : '';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file_path}${refParam}`;

    const decodeBase64 = (b64) => {
      const binary = atob(b64.replace(/\n/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    };

    const encodeBase64 = (str) => {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    const safeError = async (res, fallback) => {
      const text = await res.text();
      let msg = fallback;
      let detail = null;
      try {
        const parsed = JSON.parse(text);
        msg = parsed.message || msg;
        detail = parsed;
      } catch { if (text) msg = text.substring(0, 200); }

      // Detect permission/scope issues
      if (res.status === 403) {
        if (msg.includes('Resource not accessible') || msg.includes('insufficient')) {
          return Response.json({
            error: 'PERMISSION_DENIED',
            message: 'Your GitHub connection does not have write access to this repository. Please reconnect your GitHub account with the "repo" scope enabled.',
          }, { status: 403 });
        }
        if (msg.includes('rate limit')) {
          return Response.json({ error: 'RATE_LIMITED', message: 'GitHub API rate limit reached. Try again later.' }, { status: 429 });
        }
      }

      return Response.json({ error: msg, status: res.status }, { status: res.status });
    };

    if (operation === 'read') {
      const res = await fetch(apiUrl, { headers });
      if (!res.ok) return safeError(res, 'File not found');
      const data = await res.json();
      const decoded = data.encoding === 'base64' ? decodeBase64(data.content) : '';
      return Response.json({ path: file_path, content: decoded, sha: data.sha, size: data.size });
    }

    if (operation === 'write' || operation === 'update') {
      if (content === undefined) return Response.json({ error: 'content is required' }, { status: 400 });

      let sha;
      const checkRes = await fetch(apiUrl, { headers });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        sha = checkData.sha;
      }

      const isUpdate = !!sha;
      const payload = {
        message: commit_message || `Oikos: ${isUpdate ? 'update' : 'create'} ${file_path}`,
        content: encodeBase64(content),
        ...(branch && { branch }),
        ...(sha && { sha }),
      };

      const writeRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!writeRes.ok) return safeError(writeRes, 'Failed to write file');
      const writeData = await writeRes.json();
      return Response.json({
        path: file_path,
        operation: isUpdate ? 'updated' : 'created',
        sha: writeData.content?.sha,
        commit_sha: writeData.commit?.sha,
        commit_url: writeData.commit?.html_url,
      });
    }

    if (operation === 'delete') {
      const checkRes = await fetch(apiUrl, { headers });
      if (!checkRes.ok) return Response.json({ error: 'File not found' }, { status: 404 });
      const checkData = await checkRes.json();
      const sha = checkData.sha;

      const delRes = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commit_message || `Oikos: delete ${file_path}`,
          sha,
          ...(branch && { branch }),
        }),
      });

      if (!delRes.ok) return safeError(delRes, 'Failed to delete file');
      const delData = await delRes.json();
      return Response.json({
        path: file_path,
        operation: 'deleted',
        commit_sha: delData.commit?.sha,
        commit_url: delData.commit?.html_url,
      });
    }

    return Response.json({ error: 'Unknown operation. Use read, write, or delete.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});