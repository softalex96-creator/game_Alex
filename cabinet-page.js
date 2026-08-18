import { signInWithGoogle, signOutLevelUp } from "./firebase-auth.js";

const elements = {
  user: document.querySelector("[data-cabinet-user]"), login: document.querySelector("[data-cabinet-login]"), dashboard: document.querySelector("[data-cabinet-dashboard]"),
  name: document.querySelector("[data-cabinet-name]"), email: document.querySelector("[data-cabinet-email]"), avatar: document.querySelector("[data-cabinet-avatar]"),
  feedback: document.querySelector("[data-cabinet-feedback]"), orders: document.querySelector("[data-cabinet-orders]"), transactions: document.querySelector("[data-cabinet-transactions]"), tickets: document.querySelector("[data-cabinet-tickets]"),
  orderCount: document.querySelector("[data-cabinet-order-count]"), ticketCount: document.querySelector("[data-cabinet-ticket-count]"), supportFeedback: document.querySelector("[data-support-feedback]"),
};
let currentUser = null;

function userKey(kind) { return currentUser ? `levelup-${kind}-${currentUser.uid}` : null; }
function read(kind) { try { return JSON.parse(localStorage.getItem(userKey(kind)) || "[]"); } catch { return []; } }
function write(kind, value) { localStorage.setItem(userKey(kind), JSON.stringify(value)); }
function formatDate(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

function empty(text) { const item = document.createElement("div"); item.className = "cabinet-empty"; item.textContent = text; return item; }
function card(title, subtitle, badge, variant = "pending") { const item = document.createElement("article"); item.className = "cabinet-record"; const copy = document.createElement("div"); const heading = document.createElement("strong"); const meta = document.createElement("span"); const status = document.createElement("span"); heading.textContent = title; meta.textContent = subtitle; status.className = `cabinet-badge cabinet-badge--${variant}`; status.textContent = badge; copy.append(heading, meta); item.append(copy, status); return item; }

function renderOrders() {
  const orders = read("orders"); elements.orderCount.textContent = String(orders.length); elements.orders.replaceChildren();
  if (!orders.length) { elements.orders.append(empty("Здесь появятся выбранные игры. Перейдите в каталог, чтобы создать первую заявку.")); return; }
  orders.slice().reverse().forEach((order) => elements.orders.append(card(order.product, `${order.price} · ${formatDate(order.createdAt)}`, "Заявка сохранена")));
}

function renderTransactions() {
  const orders = read("orders"); elements.transactions.replaceChildren();
  if (!orders.length) { elements.transactions.append(empty("Подтверждённых транзакций пока нет.")); return; }
  orders.slice().reverse().forEach((order) => elements.transactions.append(card(order.product, `${order.price} · создана ${formatDate(order.createdAt)}`, "Ожидает оплаты", "waiting")));
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
document.querySelector("[data-support-form]")?.addEventListener("submit", (event) => {
  event.preventDefault(); if (!currentUser) return;
  const form = event.currentTarget; const data = new FormData(form); const tickets = read("tickets");
  tickets.push({ topic: data.get("topic"), message: data.get("message").trim(), createdAt: new Date().toISOString() }); write("tickets", tickets); form.reset(); elements.supportFeedback.textContent = "Обращение сохранено. Ответ появится здесь после подключения поддержки."; renderTickets();
});
window.addEventListener("levelup-auth", (event) => setUser(event.detail));
setUser(window.levelUpUser);
