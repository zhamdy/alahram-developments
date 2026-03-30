interface Env {
  UPLOADS: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  // Strip leading /uploads/ to get the R2 key
  const key = url.pathname.replace(/^\/uploads\//, '');

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const object = await context.env.UPLOADS.get(key);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=604800'); // 7 days

  return new Response(object.body, { headers });
};
