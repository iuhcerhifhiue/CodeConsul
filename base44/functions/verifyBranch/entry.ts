import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const verifyUrl = Deno.env.get('CONSUL_VERIFY_URL');
    const verifySecret = Deno.env.get('CONSUL_VERIFY_SECRET');
    if (!verifyUrl) return Response.json({ error: 'CONSUL_VERIFY_URL not configured' }, { status: 500 });

    const body = await req.json();
    const { repo_full_name, branch } = body;
    if (!repo_full_name || !branch) {
      return Response.json({ error: 'repo_full_name and branch are required' }, { status: 400 });
    }

    const res = await fetch(`${verifyUrl.replace(/\/$/, '')}/api/verify-external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(verifySecret && { 'X-Consul-Secret': verifySecret }),
      },
      body: JSON.stringify({ repo_full_name, branch }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: data.error || `verify service responded ${res.status}` }, { status: res.status });
    }

    // Pass through the VerificationResult shape as-is (ran, passed, failures, output, summary, ...).
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
