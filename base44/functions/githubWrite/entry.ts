import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { operation, repo_full_name, file_path, content, commit_message, branch } = body;

    if (!repo_full_name || !file_path) {
      return Response.json({ error: 'repo_full_name and file_path are required' }, { status: 400 });
    }

    const token = Deno.env.get('GITHUB_TOKEN')?.trim();
    if (!token) return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Consul-Oikos',
    };

    const [owner, repo] = repo_full_name.split('/');
    const refParam = branch ? `?ref=${branch}` : '';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file_path}${refParam}`;

    // Helper: decode base64 to UTF-8 string
    const decodeBase64 = (b64) => {
      const binary = atob(b64.replace(/\n/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    };

    // Helper: encode UTF-8 string to base64
    const encodeBase64 = (str) => {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    if (operation === 'read') {
      const res = await fetch(apiUrl, { headers });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'File not found';
        try { msg = JSON.parse(text).message || msg; } catch { if (text) msg = text.substring(0, 200); }
        return Response.json({ error: msg }, { status: res.status });
      }
      const data = await res.json();
      const decoded = data.encoding === 'base64' ? decodeBase64(data.content) : '';
      return Response.json({
        path: file_path,
        content: decoded,
        sha: data.sha,
        size: data.size,
      });
    }

    if (operation === 'write' || operation === 'update') {
      if (content === undefined) {
        return Response.json({ error: 'content is required for write operation' }, { status: 400 });
      }

      // Check if file exists to get sha (needed for updates)
      let sha;
      const checkRes = await fetch(apiUrl, { headers });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        sha = checkData.sha;
      }

      const isUpdate = !!sha;
      const encodedContent = encodeBase64(content);
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

      if (!writeRes.ok) {
        const text = await writeRes.text();
        let msg = 'Failed to write file';
        try { msg = JSON.parse(text).message || msg; } catch { if (text) msg = text.substring(0, 200); }
        return Response.json({ error: msg }, { status: writeRes.status });
      }

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
      if (!checkRes.ok) {
        return Response.json({ error: 'File not found' }, { status: 404 });
      }
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

      if (!delRes.ok) {
        const text = await delRes.text();
        let msg = 'Failed to delete file';
        try { msg = JSON.parse(text).message || msg; } catch { if (text) msg = text.substring(0, 200); }
        return Response.json({ error: msg }, { status: delRes.status });
      }

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