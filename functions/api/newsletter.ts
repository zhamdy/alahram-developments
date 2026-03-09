interface Env {
  FORM_DATA: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = (await context.request.json()) as { email?: string };
    const email = body?.email;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json(
        { success: false, message: 'Invalid email' },
        { status: 400, headers: corsHeaders },
      );
    }

    const sanitized = email.trim().toLowerCase();
    const key = `subscriber:${sanitized}`;

    const existing = await context.env.FORM_DATA.get(key);
    if (existing) {
      return Response.json(
        { success: true, message: 'Already subscribed' },
        { headers: corsHeaders },
      );
    }

    await context.env.FORM_DATA.put(
      key,
      JSON.stringify({ email: sanitized, subscribedAt: new Date().toISOString() }),
    );

    return Response.json(
      { success: true, message: 'Subscribed successfully' },
      { headers: corsHeaders },
    );
  } catch {
    return Response.json(
      { success: false, message: 'Invalid request' },
      { status: 400, headers: corsHeaders },
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
