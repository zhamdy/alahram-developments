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
    const body = (await context.request.json()) as {
      name?: string;
      phone?: string;
      message?: string;
    };

    const { name, phone, message } = body ?? {};

    if (!name || !phone || !message) {
      return Response.json(
        { success: false, message: 'All fields are required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const timestamp = new Date().toISOString();
    const key = `contact:${timestamp}`;

    await context.env.FORM_DATA.put(
      key,
      JSON.stringify({
        name: String(name).trim(),
        phone: String(phone).trim(),
        message: String(message).trim(),
        submittedAt: timestamp,
      }),
    );

    return Response.json(
      { success: true, message: 'Message received' },
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
