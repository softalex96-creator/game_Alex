const apiOrigin = "https://api.gamemaster.cc";
const paymentLinkPrefix = "levelup-payment-link-";

function readArray(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}

function localOrderId(order, index) {
  return order.id || `${order.createdAt || "legacy"}-${order.product || "item"}-${index}`;
}

function paymentLinkKey(orderId) { return `${paymentLinkPrefix}${orderId}`; }
function priceValue(value) { return Number(String(value).replace(/\D/g, "")) || 0; }

function rememberLegacyPayment(order, userUid) {
  const pending = readArray(`levelup-orders-${userUid}`).map((item, index) => ({ ...item, id: localOrderId(item, index) }));
  const used = new Set();
  const matched = order.items.map((paidItem) => {
    const index = pending.findIndex((item, itemIndex) => !used.has(itemIndex) && item.product === paidItem.title && priceValue(item.price) === Number(paidItem.price));
    if (index < 0) return null;
    used.add(index);
    return pending[index];
  });
  if (matched.some((item) => !item)) return false;
  rememberPayment(order.id, userUid, matched, "card");
  return true;
}

export function rememberPayment(orderId, userUid, items, method = "card") {
  if (!orderId || !userUid || !Array.isArray(items) || !items.length) return;
  localStorage.setItem(paymentLinkKey(orderId), JSON.stringify({
    orderId,
    userUid,
    method,
    items: items.map((item) => ({ ...item })),
    createdAt: new Date().toISOString(),
  }));
}

export function applyPaidOrder(order) {
  if (!order?.id || order.status !== "paid") return false;
  const key = paymentLinkKey(order.id);
  let link;
  try { link = JSON.parse(localStorage.getItem(key) || "null"); } catch { link = null; }
  if (!link?.userUid || !Array.isArray(link.items)) return false;

  const ordersKey = `levelup-orders-${link.userUid}`;
  const transactionsKey = `levelup-transactions-${link.userUid}`;
  const paidIds = new Set(link.items.map((item, index) => localOrderId(item, index)));
  const pending = readArray(ordersKey);
  const remaining = pending.filter((item, index) => !paidIds.has(localOrderId(item, index)));
  const transactions = readArray(transactionsKey);
  const existing = new Set(transactions.map((item) => `${item.providerOrderId}:${item.sourceOrderId}`));
  const paidAt = order.updatedAt || new Date().toISOString();

  link.items.forEach((item, index) => {
    const sourceOrderId = localOrderId(item, index);
    const transactionKey = `${order.id}:${sourceOrderId}`;
    if (existing.has(transactionKey)) return;
    transactions.push({
      ...item,
      id: transactionKey,
      sourceOrderId,
      providerOrderId: order.id,
      paymentStatus: "paid",
      method: link.method || "card",
      paidAt,
      createdAt: paidAt,
    });
  });

  localStorage.setItem(ordersKey, JSON.stringify(remaining));
  localStorage.setItem(transactionsKey, JSON.stringify(transactions));
  localStorage.setItem(key, JSON.stringify({ ...link, syncedAt: new Date().toISOString() }));
  return true;
}

export async function fetchAndSyncPayment(orderId) {
  const response = await fetch(`${apiOrigin}/payments/betatransfer/order?orderId=${encodeURIComponent(orderId)}`, { credentials: "omit", cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось проверить статус заказа.");
  const order = await response.json();
  if (order.status === "paid") applyPaidOrder(order);
  return order;
}

export async function reconcileUserPayments(userUid) {
  if (!userUid) return 0;
  let confirmed = 0;
  const lastOrderId = sessionStorage.getItem("levelup-last-order-id");
  if (lastOrderId && !localStorage.getItem(paymentLinkKey(lastOrderId))) {
    try {
      const order = await fetchAndSyncPayment(lastOrderId);
      if (order.status === "paid" && rememberLegacyPayment(order, userUid) && applyPaidOrder(order)) confirmed += 1;
    } catch { /* A later cabinet visit will retry while the order remains pending. */ }
  }
  const links = Object.keys(localStorage)
    .filter((key) => key.startsWith(paymentLinkPrefix))
    .map((key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } })
    .filter((link) => link?.userUid === userUid && !link.syncedAt);
  const results = await Promise.allSettled(links.map((link) => fetchAndSyncPayment(link.orderId)));
  return confirmed + results.filter((result) => result.status === "fulfilled" && result.value?.status === "paid").length;
}
