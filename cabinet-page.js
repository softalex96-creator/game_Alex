import { signInWithGoogle, signOutLevelUp } from "./firebase-auth.js";

const elements = {
  user: document.querySelector("[data-cabinet-user]"), login: document.querySelector("[data-cabinet-login]"), dashboard: document.querySelector("[data-cabinet-dashboard]"),
  name: document.querySelector("[data-cabinet-name]"), email: document.querySelector("[data-cabinet-email]"), avatar: document.querySelector("[data-cabinet-avatar]"),
  feedback: document.querySelector("[data-cabinet-feedback]"), orders: document.querySelector("[data-cabinet-orders]"), transactions: document.querySelector("[data-cabinet-transactions]"), tickets: document.querySelector("[data-cabinet-tickets]"),
  orderCount: document.querySelector("[data-cabinet-order-count]"), ticketCount: document.querySelector("[data-cabinet-ticket-count]"), supportFeedback: document.querySelector("[data-support-feedback]"),
  cartSummary: document.querySelector("[data-cart-summary]"), cartSelectedCount: document.querySelector("[data-cart-selected-count]"), cartTotal: document.querySelector("[data-cart-total]"), openDemoPayment: document.querySelector("[data-open-demo-payment]"),
  paymentModal: document.querySelector("[data-demo-payment]"), paymentItems: document.querySelector("[data-demo-payment-items]"), paymentForm: document.querySelector("[data-demo-payment-form]"), paymentFeedback: document.querySelector("[data-demo-payment-feedback]"), paymentMethodInputs: [...document.querySelectorAll("[name='payment-method']")], paymentMethodPanels: [...document.querySelectorAll("[data-payment-method-panel]")], paymentSubmit: document.querySelector("[data-demo-payment-submit]"), paymentCardInput: document.querySelector("[data-payment-card]"), paymentPhoneInput: document.querySelector("[data-payment-phone]"),
};
let currentUser = null;
let selectedOrderIds = new Set();
const minimumOrderAmount = 1000;

function userKey(kind) { return currentUser ? `levelup-${kind}-${currentUser.uid}` : null; }
function read(kind) { try { return JSON.parse(localStorage.getItem(userKey(kind)) || "[]"); } catch { return []; } }
function write(kind, value) { localStorage.setItem(userKey(kind), JSON.stringify(value)); }
function formatDate(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

function empty(text) { const item = document.createElement("div"); item.className = "cabinet-empty"; item.textContent = text; return item; }
function card(title, subtitle, badge, variant = "pending") { const item = document.createElement("article"); item.className = "cabinet-record"; const copy = document.createElement("div"); const heading = document.createElement("strong"); const meta = document.createElement("span"); const status = document.createElement("span"); heading.textContent = title; meta.textContent = subtitle; status.className = `cabinet-badge cabinet-badge--${variant}`; status.textContent = badge; copy.append(heading, meta); item.append(copy, status); return item; }

function orderId(order, index) { return order.id || `${order.createdAt || "legacy"}-${order.product}-${index}`; }
function priceValue(price) { return Number(String(price).replace(/\D/g, "")) || 0; }
function rubles(value) { const amount = Math.round(value * 0.9); return `${amount.toLocaleString("ru-RU")} ₽`; }
function priceInRubles(price) { return rubles(priceValue(price)); }
function pendingOrders() { return read("orders").map((order, index) => ({ ...order, id: orderId(order, index) })).filter((order) => order.paymentStatus !== "paid" && priceValue(order.price) >= minimumOrderAmount); }
function paymentMethod() { return elements.paymentMethodInputs.find((input) => input.checked)?.value || "card"; }
function paymentMethodLabel(method) { return method === "mobile" ? "Мобильная коммерция" : "Банковская карта"; }
function renderPaymentMethod() { const method = paymentMethod(); elements.paymentMethodPanels.forEach((panel) => { panel.hidden = panel.dataset.paymentMethodPanel !== method; }); if (elements.paymentCardInput) { elements.paymentCardInput.disabled = method !== "card"; elements.paymentCardInput.required = method === "card"; } if (elements.paymentPhoneInput) { elements.paymentPhoneInput.disabled = method !== "mobile"; elements.paymentPhoneInput.required = method === "mobile"; } if (elements.paymentSubmit) elements.paymentSubmit.textContent = method === "mobile" ? "Оплатить" : "Продолжить с картой"; }

function renderCartSummary() {
  const orders = pendingOrders();
  selectedOrderIds = new Set([...selectedOrderIds].filter((id) => orders.some((order) => order.id === id)));
  const selected = orders.filter((order) => selectedOrderIds.has(order.id));
  const total = selected.reduce((sum, order) => sum + priceValue(order.price), 0);
  elements.cartSummary.hidden = !orders.length;
  elements.cartSelectedCount.textContent = String(selected.length);
  elements.cartTotal.textContent = rubles(total, false);
  elements.openDemoPayment.disabled = !selected.length;
}

function resetCartSummary() {
  selectedOrderIds.clear();
  elements.cartSummary.hidden = true;
  elements.cartSelectedCount.textContent = "0";
  elements.cartTotal.textContent = "0 ₽";
  elements.openDemoPayment.disabled = true;
}

function removePendingOrder(orderIdToRemove, productName) {
  const orders = read("orders").map((order, index) => ({ ...order, id: orderId(order, index) })).filter((order) => order.paymentStatus === "paid" || priceValue(order.price) >= minimumOrderAmount);
  write("orders", orders.filter((order) => order.id !== orderIdToRemove));
  selectedOrderIds.delete(orderIdToRemove);
  render();
  elements.feedback.textContent = `${productName} удалён из корзины.`;
}

function renderOrders() {
  const orders = read("orders").map((order, index) => ({ ...order, id: orderId(order, index) }));
  elements.orderCount.textContent = String(orders.filter((order) => order.paymentStatus !== "paid").length); elements.orders.replaceChildren();
  if (!orders.length) { elements.orders.append(empty("Здесь появятся выбранные игры. Перейдите в каталог, чтобы добавить первую позицию.")); resetCartSummary(); return; }
  orders.slice().reverse().forEach((order) => {
    const paid = order.paymentStatus === "paid";
    const item = card(order.product, `${priceInRubles(order.price)} · ${formatDate(order.createdAt)}`, paid ? "Оплачено" : "В корзине", paid ? "accepted" : "waiting");
    if (!paid) {
      const select = document.createElement("label"); select.className = "cart-select";
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = selectedOrderIds.has(order.id); checkbox.setAttribute("aria-label", `Выбрать ${order.product}`);
      checkbox.addEventListener("change", () => { checkbox.checked ? selectedOrderIds.add(order.id) : selectedOrderIds.delete(order.id); renderCartSummary(); });
      const label = document.createElement("span"); label.textContent = "К оплате"; select.append(checkbox, label); item.append(select);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cart-remove";
      remove.title = `Удалить «${order.product}» из корзины`;
      remove.setAttribute("aria-label", `Удалить «${order.product}» из корзины`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>';
      remove.addEventListener("click", () => removePendingOrder(order.id, order.product));
      item.append(remove);
    }
    elements.orders.append(item);
  });
  renderCartSummary();
}

function renderTransactions() {
  const transactions = read("transactions").filter((transaction) => transaction.paymentStatus === "paid"); elements.transactions.replaceChildren();
  if (!transactions.length) { elements.transactions.append(empty("Подтверждённых платежей пока нет.")); return; }
  transactions.slice().reverse().forEach((transaction) => elements.transactions.append(card(transaction.product, `${priceInRubles(transaction.price)} · ${paymentMethodLabel(transaction.method)} · ${formatDate(transaction.createdAt)}`, "Оплачено", "accepted")));
}

function renderTickets() {
  const tickets = read("tickets"); elements.ticketCount.textContent = String(tickets.length); elements.tickets.replaceChildren();
  if (!tickets.length) { elements.tickets.append(empty("Обращений пока нет. Поддержка на связи, если понадобится помощь.")); return; }
  tickets.slice().reverse().forEach((ticket) => elements.tickets.append(card(ticket.topic, `${ticket.message} · ${formatDate(ticket.createdAt)}`, "Принято", "accepted")));
}

function render() { renderOrders(); renderTransactions(); renderTickets(); }
function setUser(user) {
  currentUser = user || null;
  elements.user.hidden = !currentUser; elements.login.hidden = Boolean(currentUser); elements.dashboard.hidden = !currentUser;
  if (!currentUser) return;
  elements.name.textContent = currentUser.displayName || "Игрок LevelUp"; elements.email.textContent = currentUser.email || "Steam-аккаунт";
  if (currentUser.photoURL) { elements.avatar.src = currentUser.photoURL; elements.avatar.hidden = false; } else { elements.avatar.hidden = true; }
  render();
}

function selectTab(name) {
  document.querySelectorAll("[data-cabinet-tab]").forEach((tab) => { const active = tab.dataset.cabinetTab === name; tab.setAttribute("aria-selected", String(active)); });
  document.querySelectorAll("[data-cabinet-panel]").forEach((panel) => { panel.hidden = panel.dataset.cabinetPanel !== name; });
}

document.querySelectorAll("[data-cabinet-tab]").forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.cabinetTab)));
document.querySelector("[data-cabinet-google]")?.addEventListener("click", async () => { elements.feedback.textContent = "Открываем защищённое окно Google…"; try { await signInWithGoogle(); } catch { elements.feedback.textContent = "Не удалось выполнить вход. Попробуйте ещё раз."; } });
document.querySelector("[data-cabinet-steam]")?.addEventListener("click", () => { window.location.assign("https://levelup-steam-auth.steam-worker.workers.dev/steam/login"); });
document.querySelector("[data-cabinet-signout]")?.addEventListener("click", async () => { await signOutLevelUp(); });
elements.paymentMethodInputs.forEach((input) => input.addEventListener("change", renderPaymentMethod));
function openPaymentDialog() {
  const selected = pendingOrders().filter((order) => selectedOrderIds.has(order.id));
  if (!selected.length) return;
  elements.paymentItems.replaceChildren();
  selected.forEach((order) => { const item = document.createElement("div"); const title = document.createElement("strong"); const price = document.createElement("span"); title.textContent = order.product; price.textContent = priceInRubles(order.price); item.append(title, price); elements.paymentItems.append(item); });
  if (elements.paymentFeedback) elements.paymentFeedback.textContent = "";

  if (!elements.paymentModal?.open && typeof elements.paymentModal?.showModal === "function") {
    elements.paymentModal.showModal();
  } else if (elements.paymentModal) {
    elements.paymentModal.setAttribute("open", "");
  }
}

elements.openDemoPayment?.addEventListener("click", openPaymentDialog);
elements.paymentModal?.querySelector(".close")?.addEventListener("click", () => elements.paymentModal.close());
document.querySelector("[data-payment-close]")?.addEventListener("click", () => elements.paymentModal.close());
document.querySelector("[data-support-form]")?.addEventListener("submit", (event) => {
  event.preventDefault(); if (!currentUser) return;
  const form = event.currentTarget; const data = new FormData(form); const tickets = read("tickets");
  tickets.push({ topic: data.get("topic"), message: data.get("message").trim(), createdAt: new Date().toISOString() }); write("tickets", tickets); form.reset(); elements.supportFeedback.textContent = "Обращение сохранено. Ответ появится здесь после подключения поддержки."; renderTickets();
});
window.addEventListener("levelup-auth", (event) => setUser(event.detail));
setUser(window.levelUpUser);
