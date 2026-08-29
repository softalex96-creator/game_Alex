import { fetchAndSyncPayment } from "./payment-sync.js";

(() => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId") || params.get("order_id") || params.get("id");
  const card = document.querySelector("[data-payment-order-card]");
  const status = document.querySelector("[data-payment-status]");
  const title = document.querySelector("[data-payment-result-title]");

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

  function renderStatus(order) {
    renderOrder(order);
    if (order.status === "paid") {
      card?.closest(".payment-result__card")?.classList.remove("payment-result__card--failure");
      const icon = document.querySelector(".payment-result__icon");
      if (icon) icon.innerHTML = '<svg viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="M16 29.5 24.1 37 40.5 19"/><circle cx="28" cy="28" r="23"/></svg>';
      if (title) title.textContent = "Оплата подтверждена";
      if (status) status.textContent = "Заказ оплачен. Мы перенесли его из корзины в историю транзакций.";
      const primaryAction = document.querySelector(".payment-result__actions .button-primary");
      if (primaryAction) { primaryAction.href = "cabinet.html#transactions"; primaryAction.textContent = "Открыть историю транзакций"; }
      document.title = "Оплата подтверждена — LevelUp";
      return true;
    }
    if (status) status.textContent = "Платёж принят. Ждём подтверждение провайдера — обычно это занимает несколько секунд.";
    return false;
  }

  const validOrderId = safeOrderId(orderId);
  if (!validOrderId) return;

  let attempts = 0;
  async function checkPayment() {
    attempts += 1;
    try {
      const order = await fetchAndSyncPayment(validOrderId);
      if (renderStatus(order) || attempts >= 30) return;
    } catch {
      if (attempts >= 30) { if (status) status.textContent = "Не удалось автоматически проверить статус. Заказ сохранён — откройте личный кабинет чуть позже."; return; }
    }
    window.setTimeout(checkPayment, 2000);
  }
  checkPayment();
})();
