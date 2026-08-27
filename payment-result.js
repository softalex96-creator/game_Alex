(() => {
  const apiOrigin = "https://api.gamemaster.cc";
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId") || params.get("order_id") || params.get("id");
  const card = document.querySelector("[data-payment-order-card]");

  function rubles(value) { return `${Number(value).toLocaleString("ru-RU")} ₽`; }
  function initials(title) { return String(title || "LU").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }
  function safeOrderId(value) { return typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value) ? value : null; }

  function renderOrder(order) {
    if (!card || !order?.id || !Array.isArray(order.items)) return;
    card.querySelector("[data-payment-order-number]").textContent = order.id;
    card.querySelector("[data-payment-order-status]").textContent = order.statusLabel || "В обработке";
    card.querySelector("[data-payment-platform]").textContent = order.platform || "—";
    card.querySelector("[data-payment-region]").textContent = order.region || "—";
    card.querySelector("[data-payment-total]").textContent = rubles(order.amount);
    const items = card.querySelector("[data-payment-items]");
    items.replaceChildren();
    order.items.forEach((item) => {
      const row = document.createElement("div"); row.className = "payment-order__item";
      const icon = document.createElement("span"); icon.className = "payment-order__game"; icon.textContent = initials(item.gameTitle || item.title);
      const copy = document.createElement("div"); copy.className = "payment-order__item-copy";
      const title = document.createElement("strong"); title.textContent = item.gameTitle || item.title;
      const option = document.createElement("span"); option.textContent = item.optionName || "Игровой товар";
      const price = document.createElement("b"); price.textContent = rubles(item.price);
      copy.append(title, option); row.append(icon, copy, price); items.append(row);
    });
    card.hidden = false;
  }

  const validOrderId = safeOrderId(orderId);
  if (!validOrderId) return;

  fetch(`${apiOrigin}/payments/betatransfer/order?orderId=${encodeURIComponent(validOrderId)}`, { credentials: "omit" })
    .then((response) => response.ok ? response.json() : null)
    .then((order) => { if (order) renderOrder(order); })
    .catch(() => {});
})();
