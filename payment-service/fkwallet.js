import crypto from "node:crypto";

const defaultBaseUrl = "https://api.fk.life/v1";
let lastNonce = 0;

function credentials(env = process.env) {
  const shopId = env.FK_WALLET_SHOP_ID;
  const apiKey = env.FK_WALLET_API_KEY;
  if (!shopId || !apiKey) throw new Error("FKWallet merchant credentials are not configured");
  return { shopId, apiKey };
}

export function signFkWalletRequest(parameters, apiKey) {
  const values = Object.entries(parameters)
    .filter(([key, value]) => key !== "signature" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => String(value));
  return crypto.createHmac("sha256", apiKey).update(values.join("|"), "utf8").digest("hex");
}

export function signFkWalletWebhook({ merchantId, amount, orderId, secret }) {
  return crypto.createHash("md5").update(`${merchantId}:${amount}:${secret}:${orderId}`, "utf8").digest("hex");
}

export async function createFkWalletPayment(order, { customerIp, fetchImpl = fetch, env = process.env } = {}) {
  const { shopId, apiKey } = credentials(env);
  const nonce = Math.max(Date.now(), lastNonce + 1); lastNonce = nonce;
  const body = { shopId: Number(shopId), nonce, paymentId: order.id, i: Number(env.FK_WALLET_PAYMENT_SYSTEM_ID || 1), email: order.customer.email, ip: customerIp, amount: order.amount.toFixed(2), currency: order.currency };
  body.signature = signFkWalletRequest(body, apiKey);
  const response = await fetchImpl(`${env.FK_WALLET_API_URL || defaultBaseUrl}/orders/create`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.type !== "success" || !payload.location) { const error = new Error(payload.message || payload.error || "FKWallet did not create an order"); error.providerStatus = response.status; throw error; }
  return payload;
}
