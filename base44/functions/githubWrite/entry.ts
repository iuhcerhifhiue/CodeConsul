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
    const { operation, repo_full_name, file_path, content, commit_message, branch } = body;

    if (!repo_full_name || !file_path) {
      return Response.json({ error: 'repo_full_name and file_path are required' }, { status: 400 });
    }

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
      try {
        const parsed = JSON.parse(text);
        msg = parsed.message || msg;
      } catch { if (text) msg = text.substring(0, 300); }
      return Response.json({ error: msg, status: res.status }, { status: res.status });
    };

    if (operation === 'read') {
      const res = await fetch(apiUrl, { headers });
      if (!res.ok) return safeError(res, 'File not found');
      const data = await res.json();
      const decoded = data.encoding === 'base64' ? decodeBase64(data.content) : '';
      return Response.json({ path: file_path, content: decoded, sha: data.sha, size: data.size });
    }

    if (operation === 'edit') {
      // Targeted patch: replace exact substrings instead of rewriting the whole file.
      // Accepts a single { old_string, new_string } or an array of edits.
      const rawEdits = Array.isArray(body.edits)
        ? body.edits
        : [{ old_string: body.old_string, new_string: body.new_string, replace_all: body.replace_all }];

      if (rawEdits.length === 0 || rawEdits.some((e) => typeof e.old_string !== 'string' || typeof e.new_string !== 'string')) {
        return Response.json({ error: 'edit requires old_string and new_string (or an edits[] array of them)' }, { status: 400 });
      }

      const readRes = await fetch(apiUrl, { headers });
      if (!readRes.ok) return safeError(readRes, 'File not found');
      const readData = await readRes.json();
      if (readData.encoding !== 'base64') {
        return Response.json({ error: 'File is not editable as text' }, { status: 422 });
      }

      let text = decodeBase64(readData.content);
      const applied = [];
      for (let i = 0; i < rawEdits.length; i++) {
        const { old_string, new_string, replace_all } = rawEdits[i];
        if (old_string === new_string) {
          return Response.json({ error: `edit ${i}: old_string and new_string are identical` }, { status: 400 });
        }
        const occurrences = text.split(old_string).length - 1;
        if (occurrences === 0) {
          return Response.json({ error: `edit ${i}: old_string not found in ${file_path}` }, { status: 422 });
        }
        if (occurrences > 1 && !replace_all) {
          return Response.json({ error: `edit ${i}: old_string is not unique (${occurrences} matches). Add more context or set replace_all: true` }, { status: 422 });
        }
        text = replace_all ? text.split(old_string).join(new_string) : text.replace(old_string, new_string);
        applied.push({ index: i, replaced: replace_all ? occurrences : 1 });
      }

      const editRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commit_message || `Oikos: edit ${file_path}`,
          content: encodeBase64(text),
          sha: readData.sha,
          ...(branch && { branch }),
        }),
      });
      if (!editRes.ok) return safeError(editRes, 'Failed to write edited file');
      const editData = await editRes.json();
      return Response.json({
        path: file_path,
        operation: 'edited',
        edits_applied: applied.length,
        applied,
        sha: editData.content?.sha,
        commit_sha: editData.commit?.sha,
        commit_url: editData.commit?.html_url,
      });
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

    return Response.json({ error: 'Unknown operation. Use read, write, edit, or delete.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});