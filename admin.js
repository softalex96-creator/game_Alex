import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { auth, signInWithGoogle, signOutLevelUp } from "./firebase-auth.js";

const STORE = "levelup-admin-ops-v1";
const ADMIN_EMAILS = new Set(["business@pulse80.cc"]);
const state = { orders: [], tasks: [], query: "", filter: "all" };
const elements = {
  login: document.querySelector("[data-admin-login]"), app: document.querySelector("[data-admin-app]"), feedback: document.querySelector("[data-admin-feedback]"),
  name: document.querySelector("[data-admin-name]"), email: document.querySelector("[data-admin-email]"), avatar: document.querySelector("[data-admin-avatar]"), greeting: document.querySelector("[data-admin-greeting]"),
  orders: document.querySelector("[data-admin-orders]"), ordersEmpty: document.querySelector("[data-admin-orders-empty]"), tasks: document.querySelector("[data-admin-tasks]"), tasksEmpty: document.querySelector("[data-admin-tasks-empty]"),
  newCount: document.querySelector("[data-admin-new-count]"), progressCount: document.querySelector("[data-admin-progress-count]"), doneCount: document.querySelector("[data-admin-done-count]"), total: document.querySelector("[data-admin-total]"), orderNavCount: document.querySelector("[data-admin-order-nav-count]"), taskNavCount: document.querySelector("[data-admin-task-nav-count]"),
  search: document.querySelector("[data-admin-search]"), filter: document.querySelector("[data-admin-status-filter]"), orderDialog: document.querySelector("[data-admin-order-dialog]"), taskDialog: document.querySelector("[data-admin-task-dialog]"),
};
const labels = { new: "Новая", paid: "Оплачено", processing: "В работе", done: "Выполнено", cancelled: "Отменено" };

function load() { try { const saved = JSON.parse(localStorage.getItem(STORE) || "{}"); state.orders = Array.isArray(saved.orders) ? saved.orders : []; state.tasks = Array.isArray(saved.tasks) ? saved.tasks : []; } catch { state.orders = []; state.tasks = []; } }
function save() { localStorage.setItem(STORE, JSON.stringify({ orders: state.orders, tasks: state.tasks })); }
function money(value) { return `${Number(value || 0).toLocaleString("ru-RU")} ₽`; }
function date(value) { return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function orderMatches(order) { const query = state.query.trim().toLowerCase(); const byStatus = state.filter === "all" || order.status === state.filter; return byStatus && (!query || `${order.id} ${order.buyer} ${order.contact} ${order.item}`.toLowerCase().includes(query)); }
function orderId() { return `LU-${String(Math.floor(1000 + Math.random() * 9000))}`; }

function renderStats() { const active = state.orders.filter((order) => order.status !== "cancelled"); const paid = state.orders.filter((order) => ["paid", "processing", "done"].includes(order.status)); const tasks = state.tasks.filter((task) => !task.done); elements.newCount.textContent = String(state.orders.filter((order) => order.status === "new").length); elements.progressCount.textContent = String(state.orders.filter((order) => order.status === "processing").length); elements.doneCount.textContent = String(state.orders.filter((order) => order.status === "done").length); elements.total.textContent = money(paid.reduce((sum, order) => sum + Number(order.amount), 0)); elements.orderNavCount.textContent = String(active.length); elements.taskNavCount.textContent = String(tasks.length); }
function renderOrders() { const orders = state.orders.filter(orderMatches); elements.orders.replaceChildren(); elements.ordersEmpty.hidden = Boolean(orders.length); orders.slice().reverse().forEach((order) => { const row = document.createElement("tr"); row.innerHTML = `<td><strong class="admin-order-id">${order.id}</strong><span class="admin-order-date">${date(order.createdAt)}</span></td><td><strong>${order.buyer}</strong><br /><span class="admin-order-date">${order.contact}</span></td><td>${order.item}</td><td><span class="admin-payment"><strong>${money(order.amount)}</strong><small>${order.method}</small></span></td><td><select class="admin-status admin-status--${order.status}" aria-label="Статус ${order.id}">${Object.entries(labels).map(([value, label]) => `<option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></td><td><button class="admin-row-button" type="button">Создать задачу</button></td>`; const select = row.querySelector("select"); select.addEventListener("change", () => { order.status = select.value; save(); render(); }); row.querySelector("button").addEventListener("click", () => createTask(`Выдать: ${order.item}`, order.id, "Оператор")); elements.orders.append(row); }); }
function renderTasks() { elements.tasks.replaceChildren(); elements.tasksEmpty.hidden = Boolean(state.tasks.length); state.tasks.slice().reverse().forEach((task) => { const item = document.createElement("label"); item.className = `admin-task${task.done ? " is-done" : ""}`; item.innerHTML = `<input type="checkbox" ${task.done ? "checked" : ""} /><span><strong>${task.title}</strong><small>${task.order || "Без заказа"} · ${task.assignee || "Не назначен"}</small></span>`; item.querySelector("input").addEventListener("change", (event) => { task.done = event.target.checked; save(); render(); }); elements.tasks.append(item); }); }
function render() { renderStats(); renderOrders(); renderTasks(); }
function createTask(title, order = "", assignee = "") { state.tasks.push({ id: crypto.randomUUID?.() || String(Date.now()), title, order, assignee, done: false }); save(); render(); }
function open(dialog) { dialog?.showModal(); }

async function renderReviews(user) {
  const content = document.querySelector(".admin-content");
  if (!content || document.querySelector("[data-admin-reviews]")) return;
  const panel = document.createElement("section"); panel.className = "admin-panel admin-reviews"; panel.dataset.adminReviews = "true";
  panel.innerHTML = `<div class="admin-panel__heading"><div><p class="admin-kicker">МОДЕРАЦИЯ</p><h2>Отзывы игроков</h2></div><span data-admin-review-count>—</span></div><div class="admin-review-list" data-admin-review-list><p class="admin-empty">Загружаем отзывы…</p></div>`;
  content.append(panel);
  try { const response = await fetch("https://api.gamemaster.cc/admin/reviews", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" }); if (!response.ok) throw new Error("request"); const { reviews = [] } = await response.json(); const list = panel.querySelector("[data-admin-review-list]"); panel.querySelector("[data-admin-review-count]").textContent = String(reviews.length); list.replaceChildren(); if (!reviews.length) { list.innerHTML = `<p class="admin-empty"><strong>Очередь пуста</strong>Новых отзывов на проверку нет.</p>`; return; } reviews.forEach((review) => { const item = document.createElement("article"); item.className = "admin-review"; item.innerHTML = `<div><strong></strong><small></small><p></p></div><div class="admin-review__actions"><button class="admin-button admin-button--primary" data-review-action="approved">Опубликовать</button><button class="admin-button admin-button--ghost" data-review-action="rejected">Отклонить</button></div>`; item.querySelector("strong").textContent = `${review.displayName} · ${"★".repeat(review.rating)}`; item.querySelector("small").textContent = review.game || "LevelUp"; item.querySelector("p").textContent = review.message; item.querySelectorAll("[data-review-action]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; const result = await fetch(`https://api.gamemaster.cc/reviews/${encodeURIComponent(review.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ status: button.dataset.reviewAction }) }); if (result.ok) item.remove(); else button.disabled = false; })); list.append(item); }); } catch { panel.querySelector("[data-admin-review-list]").innerHTML = `<p class="admin-empty">Не удалось загрузить очередь отзывов.</p>`; }
}

document.querySelector("[data-admin-sign-in]")?.addEventListener("click", async () => { elements.feedback.textContent = "Открываем защищённое окно Google…"; try { await signInWithGoogle(); } catch { elements.feedback.textContent = "Не удалось выполнить вход. Попробуйте ещё раз."; } });
document.querySelector("[data-admin-sign-out]")?.addEventListener("click", () => signOutLevelUp());
document.querySelectorAll("[data-open-order-dialog]").forEach((button) => button.addEventListener("click", () => open(elements.orderDialog)));
document.querySelectorAll("[data-open-task-dialog]").forEach((button) => button.addEventListener("click", () => open(elements.taskDialog)));
elements.search?.addEventListener("input", () => { state.query = elements.search.value; renderOrders(); });
elements.filter?.addEventListener("change", () => { state.filter = elements.filter.value; renderOrders(); });
document.querySelector("[data-admin-order-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); state.orders.push({ id: orderId(), buyer: form.get("buyer").trim(), contact: form.get("contact").trim(), item: form.get("item").trim(), amount: Number(form.get("amount")), method: form.get("method"), status: "new", createdAt: new Date().toISOString() }); save(); event.currentTarget.reset(); elements.orderDialog.close(); render(); });
document.querySelector("[data-admin-task-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createTask(form.get("title").trim(), form.get("order").trim(), form.get("assignee").trim()); event.currentTarget.reset(); elements.taskDialog.close(); });

load();
onAuthStateChanged(auth, async (user) => {
  const email = user?.email?.trim().toLowerCase();
  const isAdmin = Boolean(email && ADMIN_EMAILS.has(email));
  elements.login.hidden = isAdmin;
  elements.app.hidden = !isAdmin;
  if (!user) { elements.feedback.textContent = ""; return; }
  if (!isAdmin) {
    elements.feedback.textContent = "Для этого Google-аккаунта не выдан доступ в операционный центр.";
    try { await signOutLevelUp(); } catch { /* Firebase already keeps the login screen closed safely. */ }
    return;
  }
  const name = user.displayName || "оператор";
  elements.name.textContent = name;
  elements.email.textContent = email;
  elements.greeting.textContent = name.split(" ")[0];
  if (user.photoURL) { elements.avatar.src = user.photoURL; elements.avatar.hidden = false; }
  render();
  renderReviews(user);
});
