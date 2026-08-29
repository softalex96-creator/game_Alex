import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const origin = process.env.PUBLIC_ORIGIN || "https://gamemaster.cc";
const ordersFile = process.env.ORDERS_FILE || path.join(dirname, "data", "orders.json");
const catalogFile = process.env.CATALOG_FILE || path.join(dirname, "..", "catalog-data.js");

function loadCatalog() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(catalogFile, "utf8"), sandbox, { filename: "catalog-data.js" });
  return new Map((sandbox.window.levelUpProducts || []).map((item) => [item.id, item]));
}

const catalog = loadCatalog();
function readOrders() { try { return JSON.parse(fs.readFileSync(ordersFile, "utf8")); } catch { return {}; } }
function writeOrders(orders) { fs.mkdirSync(path.dirname(ordersFile), { recursive: true, mode: 0o700 }); fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), { mode: 0o600 }); }
function json(response, status, body, request) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (request.headers.origin === origin) headers["Access-Control-Allow-Origin"] = origin;
  response.writeHead(status, headers); response.end(JSON.stringify(body));
}
function text(response, status, body) { response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); response.end(body); }
function md5(value) { return crypto.createHash("md5").update(value, "utf8").digest("hex"); }
function parseBody(request) { return new Promise((resolve, reject) => { let data = ""; request.on("data", (chunk) => { data += chunk; if (data.length > 50_000) reject(new Error("Request too large")); }); request.on("end", () => resolve(data)); request.on("error", reject); }); }
async function parseProviderPayload(request) {
  const raw = await parseBody(request);
  if ((request.headers["content-type"] || "").includes("application/json")) return JSON.parse(raw || "{}");
  return Object.fromEntries(new URLSearchParams(raw));
}
function hasValidSignature(received, expected) {
  const actual = Buffer.from(String(received || ""), "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
}
function requestSignature(parameters) {
  const apiSecret = process.env.BETA_TRANSFER_API_SECRET;
  if (!apiSecret) return null;
  // BetaTransfer requires the values in request-body order, concatenated with no separator,
  // followed by the API secret. Keep this array in the exact order sent below.
  return md5(parameters.map((value) => String(value ?? "")).join("") + apiSecret);
}
function orderReturnUrl(value, orderId) {
  if (!value) return "";
  const url = new URL(value);
  url.searchParams.set("orderId", orderId);
  return url.toString();
}
function normalizeItems(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) throw new Error("Choose from 1 to 10 items");
  return value.map(({ gameId, optionIndex, gameAccount }) => {
    const product = catalog.get(gameId); const option = product?.options?.[Number(optionIndex)];
    if (!product || !Number.isInteger(Number(optionIndex)) || !option || !Number.isInteger(option.price) || option.price <= 0) throw new Error("Unsupported catalog item");
    const account = String(gameAccount || "").trim();
    if (account.length < 2 || account.length > 120) throw new Error("Invalid game account");
    return { gameId: product.id, optionIndex: Number(optionIndex), gameAccount: account, gameTitle: product.title, optionName: option.name, platform: product.platform, region: product.region, title: `${product.title} — ${option.name}`, price: option.price };
  });
}
async function createProviderPayment(order, request) {
  const apiKey = process.env.BETA_TRANSFER_API_KEY;
  const apiSecret = process.env.BETA_TRANSFER_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("Payment gateway credentials are not configured");
  const fields = [
    ["orderId", order.id],
    ["amount", String(order.amount)],
    ["currency", "RUB"],
    ["paymentSystem", ""],
    ["urlResult", process.env.CALLBACK_URL || ""],
    ["urlSuccess", orderReturnUrl(process.env.SUCCESS_URL, order.id)],
    ["urlFail", orderReturnUrl(process.env.FAILURE_URL, order.id)],
    ["locale", "ru"],
    ["redirect", "0"],
    ["payerId", ""],
    ["payerPhone", ""],
    ["payerName", ""],
    ["payerEmail", ""],
    ["payer_firstname", ""],
    ["payer_lastname", ""],
    ["payer_postcode", ""],
    ["payer_address", ""],
    ["payer_country", ""],
    ["ip", request.socket.remoteAddress || ""],
    ["user_comment", `LevelUp order ${order.id}`],
    ["fullCallback", "1"]
  ];
  const sign = requestSignature(fields.map(([, value]) => value));
  if (!sign) throw new Error("Provider signature format is not configured");
  const body = new URLSearchParams([...fields, ["sign", sign]]);
  const provider = await fetch(`https://merchant.betatransfer.io/api/payment?token=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body });
  const payload = await provider.json().catch(() => ({}));
  if (!provider.ok || !payload.url) throw new Error("Payment gateway did not create an order");
  return payload;
}

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return response.end(); }
  if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, catalogItems: catalog.size }, request);
  if (request.method === "GET" && url.pathname === "/payments/betatransfer/order") {
    const orderId = url.searchParams.get("orderId") || "";
    if (!/^LU-\d+-[a-z0-9-]{8,}$/i.test(orderId)) return json(response, 400, { error: "Invalid order" }, request);
    const order = readOrders()[orderId];
    if (!order) return json(response, 404, { error: "Order not found" }, request);
    const firstItem = order.items?.[0] || {};
    const statusLabel = order.status === "paid" ? "Оплачено" : order.status === "failed" ? "Платёж не выполнен" : "В обработке";
    return json(response, 200, { id: order.id, amount: order.amount, statusLabel, platform: firstItem.platform || "—", region: firstItem.region || "—", items: order.items.map(({ gameTitle, optionName, title, price }) => ({ gameTitle, optionName, title, price })) }, request);
  }
  if (request.method === "POST" && url.pathname === "/payments/betatransfer/create") {
    try {
      if (request.headers.origin !== origin) return json(response, 403, { error: "Origin is not allowed" }, request);
      const { items } = JSON.parse(await parseBody(request)); const selected = normalizeItems(items);
      const order = { id: `LU-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, amount: selected.reduce((sum, item) => sum + item.price, 0), currency: "RUB", items: selected, status: "created", createdAt: new Date().toISOString() };
      const provider = await createProviderPayment(order, request); order.providerId = provider.id; order.providerHash = provider.hash; order.status = "awaiting_payment";
      const orders = readOrders(); orders[order.id] = order; writeOrders(orders);
      return json(response, 201, { orderId: order.id, paymentUrl: provider.url }, request);
    } catch (error) { console.error("payment_create", error.message); return json(response, 422, { error: "Unable to start payment" }, request); }
  }
  if (request.method === "POST" && url.pathname === "/payments/betatransfer/webhook") {
    try {
      const payload = await parseProviderPayload(request);
      const apiSecret = process.env.BETA_TRANSFER_API_SECRET;
      if (!apiSecret) return text(response, 503, "Webhook verification is not configured");
      const expectedSign = md5(`${payload.amount ?? ""}${payload.orderId ?? ""}${apiSecret}`);
      if (!hasValidSignature(payload.sign, expectedSign)) return json(response, 403, { error: "Invalid signature" }, request);
      if (!/^LU-\d+-[a-z0-9-]{8,}$/i.test(payload.orderId || "")) return json(response, 400, { error: "Invalid order" }, request);
      const orders = readOrders(); const order = orders[payload.orderId];
      if (!order) return json(response, 404, { error: "Order not found" }, request);
      if (String(payload.orderAmount) !== String(order.amount) || payload.currency !== order.currency) return json(response, 422, { error: "Order details do not match" }, request);
      order.providerId = payload.id || order.providerId;
      order.providerStatus = "success";
      order.paidAmount = payload.paidAmount || "";
      order.updatedAt = new Date().toISOString();
      order.status = "paid";
      orders[order.id] = order; writeOrders(orders);
      return text(response, 200, "OK");
    } catch (error) { console.error("payment_webhook", error.message); return json(response, 400, { error: "Invalid callback" }, request); }
  }
  return json(response, 404, { error: "Not found" }, request);
}).listen(port, "127.0.0.1", () => console.log(`LevelUp payment service listening on ${port}`));
