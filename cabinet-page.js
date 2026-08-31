import { signInWithGoogle, signOutLevelUp } from "./firebase-auth.js?v=resend-email-1";
import { reconcileUserPayments, rememberPayment } from "./payment-sync.js";

const elements = {
  user: document.querySelector("[data-cabinet-user]"), login: document.querySelector("[data-cabinet-login]"), dashboard: document.querySelector("[data-cabinet-dashboard]"),
  name: document.querySelector("[data-cabinet-name]"), email: document.querySelector("[data-cabinet-email]"), avatar: document.querySelector("[data-cabinet-avatar]"),
  feedback: document.querySelector("[data-cabinet-feedback]"), orders: document.querySelector("[data-cabinet-orders]"), transactions: document.querySelector("[data-cabinet-transactions]"), tickets: document.querySelector("[data-cabinet-tickets]"),
  orderCount: document.querySelector("[data-cabinet-order-count]"), transactionCount: document.querySelector("[data-cabinet-transaction-count]"), transactionTab: document.querySelector("[data-cabinet-tab='transactions']"), ticketCount: document.querySelector("[data-cabinet-ticket-count]"), supportFeedback: document.querySelector("[data-support-feedback]"),
  cartSummary: document.querySelector("[data-cart-summary]"), cartSelectedCount: document.querySelector("[data-cart-selected-count]"), cartTotal: document.querySelector("[data-cart-total]"), openDemoPayment: document.querySelector("[data-open-demo-payment]"),
  paymentModal: document.querySelector("[data-demo-payment]"), paymentItems: document.querySelector("[data-demo-payment-items]"), paymentForm: document.querySelector("[data-demo-payment-form]"), paymentFeedback: document.querySelector("[data-demo-payment-feedback]"), paymentMethodInputs: [...document.querySelectorAll("[name='payment-method']")], paymentMethodPanels: [...document.querySelectorAll("[data-payment-method-panel]")], paymentSubmit: document.querySelector("[data-demo-payment-submit]"), paymentCardInput: document.querySelector("[data-payment-card]"), paymentPhoneInput: document.querySelector("[data-payment-phone]"),
};
const paymentApiOrigin = "https://api.gamemaster.cc";
let currentUser = null;
let selectedOrderIds = new Set();
const minimumOrderAmount = 1000;
const gameAccountRequirements = {
  "world-of-warcraft": { label: "BattleTag или e-mail Battle.net", placeholder: "Например: Player#1234", hint: "Укажите BattleTag или почту Battle.net. Пароль не нужен." },
  "mobile-legends": { label: "User ID и Zone ID", placeholder: "Например: 12345678 (1234)", hint: "Откройте профиль в игре: там отображаются User ID и Zone ID." },
  "pubg-mobile": { label: "Player ID", placeholder: "Например: 5123456789", hint: "Нужен числовой Player ID из профиля PUBG MOBILE." },
  "pubg-battlegrounds": { label: "Steam ID или ссылка на профиль", placeholder: "https://steamcommunity.com/id/...", hint: "Укажите публичную ссылку Steam или Steam ID." },
  "genshin-impact": { label: "UID Genshin Impact", placeholder: "Например: 7xxxxxxxx", hint: "UID указан внизу экрана в игре." },
  "honkai-star-rail": { label: "UID Honkai: Star Rail", placeholder: "Например: 7xxxxxxxx", hint: "UID указан в профиле или внизу экрана игры." },
  "zenless-zone-zero": { label: "UID Zenless Zone Zero", placeholder: "Например: 1xxxxxxxx", hint: "UID указан в профиле игрока." },
  "wuthering-waves": { label: "UID Wuthering Waves", placeholder: "Введите UID", hint: "UID указан в профиле игрока." },
  valorant: { label: "Riot ID", placeholder: "Например: Player#RU1", hint: "Укажите Riot ID вместе с тегом после символа #." },
  roblox: { label: "Имя пользователя Roblox", placeholder: "Например: Builderman", hint: "Укажите @username из профиля Roblox, не отображаемое имя." },
  minecraft: { label: "Никнейм Minecraft или Xbox gamertag", placeholder: "Например: AlexPlayer", hint: "Для цифрового кода пароль или почта Microsoft не требуются." },
  fortnite: { label: "Epic Account ID", placeholder: "Введите Epic Account ID", hint: "В Fortnite: Настройки → Учётная запись и конфиденциальность → Epic Account ID." },
  "brawl-stars": { label: "Тег игрока Brawl Stars", placeholder: "Например: #ABC123", hint: "Тег указан в профиле игрока." },
  "clash-royale": { label: "Тег игрока Clash Royale", placeholder: "Например: #ABC123", hint: "Тег указан в профиле игрока." },
  "marvel-rivals": { label: "UID Marvel Rivals", placeholder: "Введите UID игрока", hint: "UID можно скопировать из профиля в игре." },
  "league-of-legends": { label: "Riot ID", placeholder: "Например: Player#RU1", hint: "Укажите Riot ID вместе с тегом после символа #." },
  "apex-legends": { label: "EA ID", placeholder: "Введите EA ID", hint: "Укажите публичный EA ID без пароля." },
  "delta-force": { label: "Player ID Delta Force", placeholder: "Введите Player ID", hint: "Player ID указан в профиле игры." },
  "honor-of-kings": { label: "Player ID Honor of Kings", placeholder: "Введите Player ID", hint: "Player ID указан в профиле игры." }
};

function userKey(kind) { return currentUser ? `levelup-${kind}-${currentUser.uid}` : null; }
function read(kind) { try { return JSON.parse(localStorage.getItem(userKey(kind)) || "[]"); } catch { return []; } }
function write(kind, value) { localStorage.setItem(userKey(kind), JSON.stringify(value)); }
function formatDate(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

function empty(text) { const item = document.createElement("div"); item.className = "cabinet-empty"; item.textContent = text; return item; }
function card(title, subtitle, badge, variant = "pending") { const item = document.createElement("article"); item.className = "cabinet-record"; const copy = document.createElement("div"); const heading = document.createElement("strong"); const meta = document.createElement("span"); const status = document.createElement("span"); heading.textContent = title; meta.textContent = subtitle; status.className = `cabinet-badge cabinet-badge--${variant}`; status.textContent = badge; copy.append(heading, meta); item.append(copy, status); return item; }

function orderId(order, index) { return order.id || `${order.createdAt || "legacy"}-${order.product}-${index}`; }
function priceValue(price) { return Number(String(price).replace(/\D/g, "")) || 0; }
function rubles(value) { return `${Math.round(value).toLocaleString("ru-RU")} ₽`; }
function priceInRubles(price) { return rubles(priceValue(price)); }
function inferGameId(order) {
  if (order.gameId) return order.gameId;
  const title = String(order.product || "").toLowerCase();
  return Object.keys(gameAccountRequirements).find((id) => title.includes(id.replaceAll("-", " ")) || title.includes(id.replaceAll("-", ""))) || "";
}
function accountRequirement(order) { return gameAccountRequirements[inferGameId(order)] || { label: "Игровой идентификатор", placeholder: "UID, Player ID или никнейм", hint: "Укажите идентификатор игрового аккаунта. Пароль и коды подтверждения не нужны." }; }
function providerItem(order) {
  const gameId = inferGameId(order);
  const product = (window.levelUpProducts || []).find((item) => item.id === gameId);
  const savedIndex = Number(order.optionIndex);
  const optionIndex = Number.isInteger(savedIndex) && product?.options?.[savedIndex]
    ? savedIndex
    : product?.options?.findIndex((option) => option.price === priceValue(order.price) || String(order.product || "").endsWith(option.name));
  if (!gameId || !Number.isInteger(optionIndex) || optionIndex < 0) throw new Error("Не удалось определить выбранный товар. Удалите его из корзины и добавьте заново.");
  const gameAccount = String(order.gameAccount || "").trim();
  if (gameAccount.length < 2 || gameAccount.length > 120) throw new Error(`Проверьте поле «${accountRequirement(order).label}».`);
  return { gameId, optionIndex, gameAccount };
}
function saveGameAccount(id, gameAccount) { write("orders", read("orders").map((order, index) => orderId(order, index) === id ? { ...order, gameAccount: gameAccount.trim() } : order)); }
function pendingOrders() { return read("orders").map((order, index) => ({ ...order, id: orderId(order, index) })).filter((order) => order.paymentStatus !== "paid" && priceValue(order.price) >= minimumOrderAmount); }
function paymentMethod() { return elements.paymentMethodInputs.find((input) => input.checked)?.value || "card"; }
function paymentMethodLabel(method) { return method === "mobile" ? "Мобильная коммерция" : "Банковская карта"; }
function renderPaymentMethod() { const method = paymentMethod(); elements.paymentMethodPanels.forEach((panel) => { panel.hidden = panel.dataset.paymentMethodPanel !== method; }); if (elements.paymentCardInput) { elements.paymentCardInput.disabled = method !== "card"; elements.paymentCardInput.required = method === "card"; } if (elements.paymentPhoneInput) { elements.paymentPhoneInput.disabled = method !== "mobile"; elements.paymentPhoneInput.required = method === "mobile"; } if (elements.paymentSubmit) elements.paymentSubmit.textContent = method === "mobile" ? "Мобильная оплата скоро" : "Перейти к защищённой оплате"; }

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
      const requirement = accountRequirement(order);
      const account = document.createElement("div");
      account.className = "cart-account";
      const label = document.createElement("label");
      label.htmlFor = `game-account-${order.id}`;
      label.textContent = requirement.label;
      const input = document.createElement("input");
      input.id = `game-account-${order.id}`;
      input.name = `game-account-${order.id}`;
      input.type = "text";
      input.autocomplete = "username";
      input.maxLength = 120;
      input.placeholder = requirement.placeholder;
      input.value = order.gameAccount || "";
      input.required = true;
      const hint = document.createElement("small");
      hint.id = `game-account-hint-${order.id}`;
      hint.textContent = `${requirement.hint} Данные сохраняются только в этом браузере до оформления.`;
      const error = document.createElement("p");
      error.className = "cart-account__error";
      error.id = `game-account-error-${order.id}`;
      error.hidden = true;
      input.setAttribute("aria-describedby", `${hint.id} ${error.id}`);
      input.addEventListener("input", () => { input.removeAttribute("aria-invalid"); error.hidden = true; saveGameAccount(order.id, input.value); });
      input.addEventListener("blur", () => saveGameAccount(order.id, input.value));
      account.append(label, input, hint, error);
      item.append(account);
      const select = document.createElement("label"); select.className = "cart-select";
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = selectedOrderIds.has(order.id); checkbox.setAttribute("aria-label", `Выбрать ${order.product}`);
      checkbox.addEventListener("change", () => { checkbox.checked ? selectedOrderIds.add(order.id) : selectedOrderIds.delete(order.id); renderCartSummary(); });
      const selectLabel = document.createElement("span"); selectLabel.textContent = "К оплате"; select.append(checkbox, selectLabel); item.append(select);
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
  elements.transactionCount.textContent = String(transactions.length);
  elements.transactionTab.setAttribute("aria-label", `Транзакции: ${transactions.length} подтверждённых оплат`);
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
  reconcileUserPayments(currentUser.uid).then((confirmed) => {
    if (!confirmed) return;
    render();
    elements.feedback.textContent = confirmed === 1 ? "Оплата подтверждена. Заказ перенесён в транзакции." : `Подтверждено оплат: ${confirmed}. Заказы перенесены в транзакции.`;
  }).catch(() => {});
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
  const missingAccount = selected.find((order) => !String(order.gameAccount || "").trim());
  if (missingAccount) {
    const input = document.getElementById(`game-account-${missingAccount.id}`);
    const error = document.getElementById(`game-account-error-${missingAccount.id}`);
    if (input) input.setAttribute("aria-invalid", "true");
    if (error) { error.textContent = `Укажите: ${accountRequirement(missingAccount).label}.`; error.hidden = false; }
    elements.feedback.textContent = "Заполните игровой идентификатор для выбранной позиции.";
    input?.focus();
    return;
  }
  elements.paymentItems.replaceChildren();
  selected.forEach((order) => { const item = document.createElement("div"); const title = document.createElement("strong"); const target = document.createElement("small"); const price = document.createElement("span"); title.textContent = order.product; target.textContent = `${accountRequirement(order).label}: ${order.gameAccount}`; price.textContent = priceInRubles(order.price); item.append(title, target, price); elements.paymentItems.append(item); });
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
elements.paymentSubmit?.addEventListener("click", async () => {
  const selected = pendingOrders().filter((order) => selectedOrderIds.has(order.id));
  elements.paymentSubmit.disabled = true;
  elements.paymentSubmit.setAttribute("aria-busy", "true");
  elements.paymentSubmit.textContent = "Создаём заказ…";
  elements.paymentFeedback.textContent = "Связываемся с защищённой платёжной страницей.";
  try {
    if (!currentUser) throw new Error("Сначала войдите в аккаунт Google.");
    const idToken = await currentUser.getIdToken();
    const response = await fetch(`${paymentApiOrigin}/payments/betatransfer/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      credentials: "omit",
      body: JSON.stringify({ items: selected.map(providerItem) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.paymentUrl || !result.orderId) throw new Error(result.error || "Платёжный сервис не создал заказ.");
    rememberPayment(result.orderId, currentUser?.uid, selected, "card");
    sessionStorage.setItem("levelup-last-order-id", result.orderId);
    window.location.assign(result.paymentUrl);
  } catch (error) {
    elements.paymentFeedback.textContent = `${error.message || "Не удалось открыть оплату."} Проверьте данные и попробуйте ещё раз.`;
    elements.paymentSubmit.disabled = false;
    elements.paymentSubmit.removeAttribute("aria-busy");
    elements.paymentSubmit.textContent = "Перейти к защищённой оплате";
  }
});
document.querySelector("[data-support-form]")?.addEventListener("submit", (event) => {
  event.preventDefault(); if (!currentUser) return;
  const form = event.currentTarget; const data = new FormData(form); const tickets = read("tickets");
  tickets.push({ topic: data.get("topic"), message: data.get("message").trim(), createdAt: new Date().toISOString() }); write("tickets", tickets); form.reset(); elements.supportFeedback.textContent = "Обращение сохранено. Ответ появится здесь после подключения поддержки."; renderTickets();
});
window.addEventListener("levelup-auth", (event) => setUser(event.detail));
renderPaymentMethod();
setUser(window.levelUpUser);
if (window.location.hash === "#transactions") selectTab("transactions");
