import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { authenticateFirebaseRequest } from "./firebase.js";
import { createDeliveryCode, sendPaymentEmail, sendWelcomeEmail } from "./email.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const origin = process.env.PUBLIC_ORIGIN || "https://gamemaster.cc";
const ordersFile = process.env.ORDERS_FILE || path.join(dirname, "data", "orders.json");
const usersFile = process.env.USERS_FILE || path.join(dirname, "data", "users.json");
const catalogFile = process.env.CATALOG_FILE || path.join(dirname, "..", "catalog-data.js");
const paymentEmailsInFlight = new Set();

function loadCatalog() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(catalogFile, "utf8"), sandbox, { filename: "catalog-data.js" });
  return new Map((sandbox.window.levelUpProducts || []).map((item) => [item.id, item]));
}

const catalog = loadCatalog();
function readOrders() { try { return JSON.parse(fs.readFileSync(ordersFile, "utf8")); } catch { return {}; } }
function writeOrders(orders) { fs.mkdirSync(path.dirname(ordersFile), { recursive: true, mode: 0o700 }); fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), { mode: 0o600 }); }
function readUsers() { try { return JSON.parse(fs.readFileSync(usersFile, "utf8")); } catch { return {}; } }
function writeUsers(users) { fs.mkdirSync(path.dirname(usersFile), { recursive: true, mode: 0o700 }); fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), { mode: 0o600 }); }
function json(response, status, body, request) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (request.headers.origin === origin) headers["Access-Control-Allow-Origin"] = origin;
  response.writeHead(status, headers); response.end(JSON.stringify(body));
}
function text(response, status, body) { response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }); response.end(body); }
function md5(value) { return crypto.createHash("md5").update(value, "utf8").digest("hex"); }
function validOrderId(value) { return /^LU(?:\d+[a-f0-9]{8}|-\d+-[a-z0-9-]{8,})$/i.test(String(value || "")); }
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
async function createProviderPayment(order) {
  const apiKey = process.env.BETA_TRANSFER_API_KEY;
  const apiSecret = process.env.BETA_TRANSFER_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("Payment gateway credentials are not configured");
  const fields = [
    ["amount", order.amount.toFixed(2)],
    ["currency", "RUB"],
    ["paymentSystem", "Card2"],
    ["orderId", order.id],
    ["urlResult", process.env.CALLBACK_URL || ""],
    ["urlSuccess", orderReturnUrl(process.env.SUCCESS_URL, order.id)],
    ["urlFail", orderReturnUrl(process.env.FAILURE_URL, order.id)]
  ];
  const sign = requestSignature(fields.map(([, value]) => value));
  if (!sign) throw new Error("Provider signature format is not configured");
  const body = new URLSearchParams([...fields, ["sign", sign]]);
  const provider = await fetch(`https://merchant.betatransfer.io/api/payment?token=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body });
  const payload = await provider.json().catch(() => ({}));
  const paymentUrl = payload.url || payload.Url || payload.urlPayment || payload.UrlPayment;
  if (!provider.ok || !paymentUrl) {
    console.error("payment_provider_rejected", provider.status, JSON.stringify(payload));
    throw new Error("Payment gateway did not create an order");
  }
  return { ...payload, id: payload.id || payload.Id, hash: payload.hash || payload.Hash, url: paymentUrl };
}

async function registerUser(user) {
  const users = readUsers();
  const previous = users[user.uid] || {};
  if (previous.welcomeEmail?.status === "sent") return { created: false, emailSent: true };
  const record = { ...previous, uid: user.uid, email: user.email, displayName: user.displayName, createdAt: previous.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), welcomeEmail: { status: "sending", updatedAt: new Date().toISOString() } };
  users[user.uid] = record; writeUsers(users);
  try {
    const emailId = await sendWelcomeEmail(user);
    const current = readUsers();
    current[user.uid] = { ...record, welcomeEmail: { status: "sent", emailId, sentAt: new Date().toISOString() } };
    writeUsers(current);
    console.log("welcome_email_sent", user.uid);
    return { created: !previous.createdAt, emailSent: true };
  } catch (error) {
    const current = readUsers();
    current[user.uid] = { ...record, welcomeEmail: { status: "failed", updatedAt: new Date().toISOString() } };
    writeUsers(current);
    console.error("welcome_email_failed", user.uid, error.message);
    throw error;
  }
}

async function deliverPaymentEmail(orderId) {
  const orders = readOrders(); const order = orders[orderId];
  if (!order || order.status !== "paid" || !order.customer?.email || order.paymentEmail?.status === "sent" || paymentEmailsInFlight.has(orderId)) return;
  paymentEmailsInFlight.add(orderId);
  order.paymentEmail = { status: "sending", updatedAt: new Date().toISOString() };
  orders[order.id] = order; writeOrders(orders);
  try {
    const emailId = await sendPaymentEmail(order);
    const current = readOrders();
    if (!current[order.id]) return;
    current[order.id].paymentEmail = { status: "sent", emailId, sentAt: new Date().toISOString() };
    writeOrders(current);
    console.log("payment_email_sent", order.id);
  } catch (error) {
    const current = readOrders();
    if (current[order.id]) { current[order.id].paymentEmail = { status: "failed", updatedAt: new Date().toISOString() }; writeOrders(current); }
    console.error("payment_email_failed", order.id, error.message);
  } finally {
    paymentEmailsInFlight.delete(orderId);
  }
}

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" }); return response.end(); }
  if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, catalogItems: catalog.size }, request);
  if (request.method === "POST" && url.pathname === "/users/register") {
    try {
      if (request.headers.origin !== origin) return json(response, 403, { error: "Origin is not allowed" }, request);
      const user = await authenticateFirebaseRequest(request);
      return json(response, 200, { ok: true, ...(await registerUser(user)) }, request);
    } catch (error) { console.error("user_register", error.message); return json(response, 401, { error: "Unable to register user" }, request); }
  }
  if (request.method === "GET" && url.pathname === "/payments/betatransfer/order") {
    const orderId = url.searchParams.get("orderId") || "";
    if (!validOrderId(orderId)) return json(response, 400, { error: "Invalid order" }, request);
    const order = readOrders()[orderId];
    if (!order) return json(response, 404, { error: "Order not found" }, request);
    const firstItem = order.items?.[0] || {};
    const statusLabel = order.status === "paid" ? "Оплачено" : order.status === "failed" ? "Платёж не выполнен" : "В обработке";
    return json(response, 200, { id: order.id, amount: order.amount, status: order.status, statusLabel, updatedAt: order.updatedAt || null, platform: firstItem.platform || "—", region: firstItem.region || "—", items: order.items.map(({ gameTitle, optionName, title, price }) => ({ gameTitle, optionName, title, price })) }, request);
  }
  if (request.method === "POST" && url.pathname === "/payments/betatransfer/create") {
    try {
      if (request.headers.origin !== origin) return json(response, 403, { error: "Origin is not allowed" }, request);
      const user = await authenticateFirebaseRequest(request);
      const { items } = JSON.parse(await parseBody(request)); const selected = normalizeItems(items);
      const order = { id: `LU${Date.now()}${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`, amount: selected.reduce((sum, item) => sum + item.price, 0), currency: "RUB", items: selected, customer: user, status: "created", createdAt: new Date().toISOString() };
      const provider = await createProviderPayment(order); order.providerId = provider.id; order.providerHash = provider.hash; order.status = "awaiting_payment";
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
      if (!validOrderId(payload.orderId)) return json(response, 400, { error: "Invalid order" }, request);
      const orders = readOrders(); const order = orders[payload.orderId];
      if (!order) return json(response, 404, { error: "Order not found" }, request);
      if (Number(payload.orderAmount) !== order.amount || String(payload.currency || "").toUpperCase() !== order.currency) return json(response, 422, { error: "Order details do not match" }, request);
      order.providerId = payload.id || order.providerId;
      order.providerStatus = "success";
      order.paidAmount = payload.paidAmount || "";
      order.updatedAt = new Date().toISOString();
      order.status = "paid";
      order.deliveryCode ||= createDeliveryCode();
      if (!order.paymentEmail || order.paymentEmail.status === "failed") order.paymentEmail = { status: "pending", updatedAt: new Date().toISOString() };
      orders[order.id] = order; writeOrders(orders);
      console.log("payment_paid", order.id, order.amount, order.currency);
      text(response, 200, "OK");
      void deliverPaymentEmail(order.id);
      return;
    } catch (error) { console.error("payment_webhook", error.message); return json(response, 400, { error: "Invalid callback" }, request); }
  }
  return json(response, 404, { error: "Not found" }, request);
}).listen(port, "127.0.0.1", () => {
  console.log(`LevelUp payment service listening on ${port}`);
  for (const order of Object.values(readOrders())) if (order.status === "paid" && order.customer?.email && order.paymentEmail?.status !== "sent") void deliverPaymentEmail(order.id);
});
