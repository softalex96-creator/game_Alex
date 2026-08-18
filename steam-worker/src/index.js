const steamOpenIdEndpoint = "https://steamcommunity.com/openid/login";
const firebaseAudience = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";

function base64Url(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function pemToBuffer(pem) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

function decodeBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function createState(secret) {
  const payload = `${Date.now()}.${crypto.randomUUID()}`;
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(payload));
  return `${base64Url(payload)}.${base64Url(signature)}`;
}

async function validState(state, secret) {
  const [encodedPayload, encodedSignature] = (state || "").split(".");
  if (!encodedPayload || !encodedSignature) return false;
  try {
    const payload = new TextDecoder().decode(decodeBase64Url(encodedPayload));
    const issuedAt = Number(payload.split(".")[0]);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > 10 * 60 * 1000) return false;
    const signature = decodeBase64Url(encodedSignature);
    return crypto.subtle.verify("HMAC", await hmacKey(secret), signature, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

async function firebaseCustomToken(steamId, env) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: env.FIREBASE_CLIENT_EMAIL,
    sub: env.FIREBASE_CLIENT_EMAIL,
    aud: firebaseAudience,
    iat: now,
    exp: now + 3600,
    uid: `steam:${steamId}`,
    claims: { steamId, provider: "steam" },
  }));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(env.FIREBASE_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64Url(signed)}`;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  return origin === env.ALLOWED_ORIGIN
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

function response(body, status, request, env) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders(request, env) } });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request, env) });

      if (url.pathname === "/steam/login" && request.method === "GET") {
      const state = await createState(env.STATE_SECRET);
      const params = new URLSearchParams({
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": `${env.ALLOWED_ORIGIN}/game_Alex/steam-callback.html?state=${encodeURIComponent(state)}`,
        "openid.realm": `${env.ALLOWED_ORIGIN}/`,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
      });
      return Response.redirect(`${steamOpenIdEndpoint}?${params}`, 302);
      }

      if (url.pathname === "/steam/verify" && request.method === "POST") {
      const { query } = await request.json().catch(() => ({}));
      const params = new URLSearchParams(query || "");
      if (!(await validState(params.get("state"), env.STATE_SECRET))) return response({ error: "Invalid or expired sign-in state." }, 400, request, env);
      params.delete("state");
      if (params.get("openid.op_endpoint") !== steamOpenIdEndpoint || params.get("openid.mode") !== "id_res") return response({ error: "Invalid Steam response." }, 400, request, env);
      params.set("openid.mode", "check_authentication");
      const check = await fetch(steamOpenIdEndpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
      if (!(await check.text()).includes("is_valid:true")) return response({ error: "Steam could not verify the sign-in." }, 401, request, env);
      const steamId = params.get("openid.claimed_id")?.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/)?.[1];
      if (!steamId) return response({ error: "Steam ID was not found." }, 400, request, env);
      return response({ token: await firebaseCustomToken(steamId, env) }, 200, request, env);
      }

      return response({ error: "Not found." }, 404, request, env);
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
