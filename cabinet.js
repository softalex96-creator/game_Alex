(() => {
  const paymentModal = document.getElementById("payment-modal");
  const accountModal = document.getElementById("account-modal");
  const paymentTitle = document.getElementById("payment-title");
  const paymentDescription = document.querySelector("[data-payment-description]");
  const paymentFeedback = document.querySelector("[data-payment-feedback]");
  const createOrderButton = document.getElementById("create-order");
  const orderList = document.querySelector("[data-order-list]");
  const orderCount = document.querySelector("[data-order-count]");
  let currentUser = null;
  let selectedProduct = null;

  function storageKey() { return currentUser ? `levelup-orders-${currentUser.uid}` : null; }

  function readOrders() {
    try { return JSON.parse(localStorage.getItem(storageKey()) || "[]"); } catch { return []; }
  }

  function renderOrders() {
    if (!orderList || !orderCount) return;
    const orders = currentUser ? readOrders() : [];
    orderCount.textContent = String(orders.length);
    orderList.replaceChildren();
    if (!orders.length) {
      const empty = document.createElement("li");
      empty.className = "account-orders__empty";
      empty.textContent = "Пока нет сохранённых заявок.";
      orderList.append(empty);
      return;
    }
    orders.slice().reverse().forEach((order) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      title.textContent = order.product;
      meta.textContent = `${order.price} · заявка сохранена`;
      item.append(title, meta);
      orderList.append(item);
    });
  }

  function setUser(user) {
    currentUser = user || null;
    renderOrders();
  }

  window.addEventListener("levelup-auth", (event) => setUser(event.detail));
  setUser(window.levelUpUser);

  document.querySelectorAll(".game-card [data-modal='payment']").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".game-card");
      selectedProduct = {
        product: card.querySelector(".game-label")?.textContent || "Игра",
        price: card.querySelector("h3 + p")?.textContent?.replace("Стартовая цена: ", "") || "цена уточняется",
      };
      paymentTitle.textContent = selectedProduct.product;
      paymentDescription.textContent = `Стартовая цена: ${selectedProduct.price}. Сохраните заявку в личном кабинете — оплата подключится позднее.`;
      paymentFeedback.textContent = "";
      createOrderButton.textContent = currentUser ? "Сохранить заявку" : "Войти, чтобы сохранить";
    });
  });

  createOrderButton?.addEventListener("click", () => {
    if (!currentUser) {
      paymentModal.close();
      accountModal.showModal();
      return;
    }
    if (!selectedProduct) return;
    const orders = readOrders();
    orders.push({ ...selectedProduct, createdAt: new Date().toISOString() });
    localStorage.setItem(storageKey(), JSON.stringify(orders));
    renderOrders();
    paymentFeedback.textContent = "Заявка сохранена в личном кабинете.";
    createOrderButton.disabled = true;
    window.setTimeout(() => { createOrderButton.disabled = false; }, 800);
  });
})();
