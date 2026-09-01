import crypto from "node:crypto";

const defaultBaseUrl = "https://secure-api.wink2paylink.com";

function sortedStrings(values = {}) {
  return Object.fromEntries(Object.entries(values)
    .filter(([key, value]) => key !== "signature" && key !== "api_secret" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, typeof value === "boolean" ? (value ? "True" : "False") : String(value)]));
}

function asciiJson(value) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function signWink2Pay({ path, get = {}, post = {}, secret, webhook = false }) {
  if (!secret) throw new Error("Wink2Pay API secret is not configured");
  const header = base64url(asciiJson({ alg: "HS256" }));
  const requestData = webhook
    ? { GET: sortedStrings(get), PATH: path, POST: sortedStrings(post) }
    : {
        PATH: path,
        ...(Object.keys(get).length ? { GET: sortedStrings(get) } : {}),
        ...(Object.keys(post).length ? { POST: sortedStrings(post) } : {}),
      };
  const payload = base64url(asciiJson(requestData));
  const raw = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64url");
  return signature;
}

export function hasValidWink2PaySignature(payload, { path, secret }) {
  const received = Buffer.from(String(payload?.signature || ""), "utf8");
  const expected = Buffer.from(signWink2Pay({ path, post: payload, secret, webhook: true }), "utf8");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function credentials(env = process.env) {
  const merchantId = env.WINK2PAY_MERCHANT_ID;
  const endpointId = env.WINK2PAY_ENDPOINT_ID;
  const secret = env.WINK2PAY_API_SECRET;
  if (!merchantId || !endpointId || !secret) throw new Error("Wink2Pay credentials are not configured");
  return { merchantId, endpointId, secret };
}

export async function createWink2PayInvoice(order, { fetchImpl = fetch, env = process.env } = {}) {
  const { merchantId, endpointId, secret } = credentials(env);
  const path = "/init";
  const post = {
    amount: order.amount.toFixed(2),
    currency: order.currency,
    customer: order.customer.uid,
    description: `LevelUp order ${order.id}`,
    device_browser_java_enabled: "True",
    email: order.customer.email,
    endpoint_id: endpointId,
    finish_url: order.finishUrl,
    merchant_id: merchantId,
    notification_url: order.notificationUrl,
    order: order.id,
    save_card: false,
  };
  post.signature = signWink2Pay({ path, post, secret });
  const response = await fetchImpl(`${env.WINK2PAY_API_URL || defaultBaseUrl}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === "error" || !payload.url) {
    const error = new Error(payload.message || "Wink2Pay did not create an invoice");
    error.providerStatus = response.status;
    error.providerCode = payload.code;
    throw error;
  }
  return payload;
}

export async function getWink2PayStatus(orderId, { fetchImpl = fetch, env = process.env } = {}) {
  const { merchantId, endpointId, secret } = credentials(env);
  const path = "/status";
  const get = { endpoint_id: endpointId, merchant_id: merchantId, order: orderId };
  get.signature = signWink2Pay({ path, get, secret });
  const query = new URLSearchParams(get);
  const response = await fetchImpl(`${env.WINK2PAY_API_URL || defaultBaseUrl}${path}?${query}`, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === "error") throw new Error(payload.message || "Unable to get Wink2Pay status");
  return payload;
}
