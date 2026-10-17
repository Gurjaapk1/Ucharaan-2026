/**
 * Same-origin bridge between the web app and the scoring service.
 * Only this server-side boundary receives KIDS_SCORING_API_KEY.
 * It streams the upstream response and does not store recordings.
 */
const ROUTES = new Map([
  ['/healthz', 'GET'],
  ['/v1/manifest', 'GET'],
  ['/v1/score', 'POST'],
  ['/v1/follow', 'POST'],
]);
const MAX_DECLARED_UPLOAD_BYTES = 25 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/scoring/')) {
      const path = url.pathname.slice('/api/scoring'.length);
      const method = ROUTES.get(path)
        || (/^\/reference\/[a-zA-Z0-9_/-]+\.wav$/.test(path) ? 'GET' : null);
      if (!method || request.method !== method) {
        return new Response('Not found', {status: 404});
      }
      if (request.method === 'POST' && request.headers.get('origin') !== url.origin) {
        return new Response('Forbidden', {status: 403});
      }
      if (!env.KIDS_SCORING_URL || !env.KIDS_SCORING_API_KEY) {
        return Response.json({error: 'Scoring is not configured.'}, {status: 503});
      }
      // This is an early check, not a replacement for a server-side streamed-body limit.
      if (Number(request.headers.get('content-length') || 0) > MAX_DECLARED_UPLOAD_BYTES) {
        return new Response('Recording too large', {status: 413});
      }
      const headers = new Headers({
        Accept: 'application/json',
        'X-Api-Key': env.KIDS_SCORING_API_KEY,
      });
      for (const name of ['content-type', 'range']) {
        if (request.headers.has(name)) headers.set(name, request.headers.get(name));
      }
      try {
        const upstream = await fetch(
          env.KIDS_SCORING_URL.replace(/\/+$/, '') + path + url.search,
          {
            method: request.method,
            headers,
            body: request.method === 'POST' ? request.body : undefined,
            // Node's local preview requires duplex; Cloudflare's runtime does not.
            ...(typeof process !== 'undefined' && process.versions?.node
              ? {duplex: 'half'} : {}),
            redirect: 'manual',
          },
        );
        // Do not forward the deployment secret to a redirect destination.
        if (upstream.status >= 300 && upstream.status < 400) {
          return Response.json({error: 'Unexpected scoring service redirect.'}, {status: 502});
        }
        const outgoing = new Headers();
        for (const name of ['content-type', 'content-range', 'accept-ranges']) {
          if (upstream.headers.has(name)) outgoing.set(name, upstream.headers.get(name));
        }
        outgoing.set('cache-control', 'no-store');
        return new Response(upstream.body, {status: upstream.status, headers: outgoing});
      } catch (error) {
        console.error('Azure scoring request failed', {name: error.name, message: error.message});
        return Response.json(
          {error: 'The scoring service could not be reached. Please try again.'},
          {status: 502},
        );
      }
    }

    // Serve the app bundle, with index.html as the client-navigation fallback.
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || !request.headers.get('accept')?.includes('text/html')) {
      return response;
    }
    url.pathname = '/index.html';
    url.search = '';
    return env.ASSETS.fetch(new Request(url, request));
  },
};
