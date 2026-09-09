const VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ALLOWED_HOSTNAMES = new Set(["gamemaster.cc", "www.gamemaster.cc"]);

export async function verifyTurnstileToken(token, { secret = process.env.TURNSTILE_SECRET_KEY, fetchImpl = fetch, remoteip } = {}) {
  if (!secret) throw new Error("Turnstile verification is not configured");
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) throw new Error("Turnstile token is invalid");

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);
  let response;
  let result;
  try {
    response = await fetchImpl(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    result = await response.json();
  } catch {
    throw new Error("Turnstile verification failed");
  }
  if (!response.ok || result?.success !== true || !ALLOWED_HOSTNAMES.has(String(result.hostname || "").toLowerCase())) {
    throw new Error("Turnstile verification failed");
  }
  return result;
}
