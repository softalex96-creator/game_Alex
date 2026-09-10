const FIREBASE_ORIGIN = "https://levelup-game-alex.firebaseapp.com";

export function isFirebaseAuthPath(pathname) {
  return pathname.startsWith("/__/auth/");
}

export function buildFirebaseTarget(url) {
  return new URL(`${url.pathname}${url.search}`, FIREBASE_ORIGIN);
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    if (!isFirebaseAuthPath(requestUrl.pathname)) {
      return new Response("Not found", { status: 404 });
    }

    const target = buildFirebaseTarget(requestUrl);
    const upstreamRequest = new Request(target, request);
    const upstreamResponse = await fetch(upstreamRequest);
    const headers = new Headers(upstreamResponse.headers);
    headers.set("Cache-Control", "no-store");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
