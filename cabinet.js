(() => {
  const paymentModal = document.getElementById("payment-modal");
  const accountModal = document.getElementById("account-modal");
  const paymentTitle = document.getElementById("payment-title");
  const paymentDescription = document.querySelector("[data-payment-description]");
  const paymentFeedback = document.querySelector("[data-payment-feedback]");
  const createOrderButton = document.getElementById("create-order");
  const orderList = document.querySelector("[data-order-list]");
  const orderCount = document.querySelector("[data-order-count]");
  const rankName = document.querySelector("[data-rank-name]");
  const rankSymbol = document.querySelector("[data-rank-symbol]");
  const rankDescription = document.querySelector("[data-rank-description]");
  const rankTrack = document.querySelector("[data-rank-track]");
  const ranks = [
    { name: "Ferrum", symbol: "Fe", title: "Железо" },
    { name: "Cuprum", symbol: "Cu", title: "Медь" },
    { name: "Zincum", symbol: "Zn", title: "Цинк" },
    { name: "Stannum", symbol: "Sn", title: "Олово" },
    { name: "Argentum", symbol: "Ag", title: "Серебро" },
    { name: "Aurum", symbol: "Au", title: "Золото" },
    { name: "Palladium", symbol: "Pd", title: "Палладий" },
    { name: "Iridium", symbol: "Ir", title: "Иридий" },
    { name: "Osmium", symbol: "Os", title: "Осмий" },
    { name: "Platinum", symbol: "Pt", title: "Платина" },
  ];
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
    renderRank(orders.length);
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

  function renderRank(orderTotal) {
    if (!rankName || !rankSymbol || !rankDescription || !rankTrack) return;
    const level = Math.min(ranks.length, Math.floor(orderTotal / 2) + 1);
    const rank = ranks[level - 1];
    const untilNext = 2 - (orderTotal % 2);
    rankName.textContent = `${rank.name} ${level}`;
    rankSymbol.textContent = rank.symbol;
    rankDescription.textContent = level === ranks.length
      ? "Вершина таблицы LevelUp. Статус Platinum достигнут."
      : `${rank.title}: ещё ${untilNext} ${untilNext === 1 ? "заявка" : "заявки"} до уровня ${ranks[level].name}.`;
    rankTrack.replaceChildren();
    ranks.forEach((item, index) => {
      const mark = document.createElement("span");
      mark.className = index < level ? "rank-track__item is-active" : "rank-track__item";
      mark.title = `${index + 1}. ${item.name} — ${item.title}`;
      mark.textContent = item.symbol;
      rankTrack.append(mark);
    });
  }

  function setUser(user) {
    currentUser = user || null;
    renderOrders();
  }

  function addToCart(product) {
    if (!currentUser) {
      accountModal?.showModal();
      window.dispatchEvent(new CustomEvent("levelup-cart-result", { detail: { message: "Войдите в кабинет, чтобы добавить товар в корзину.", variant: "warning" } }));
      return false;
    }
    if (!product) return false;
    const orders = readOrders();
    orders.push({ ...product, createdAt: new Date().toISOString() });
    localStorage.setItem(storageKey(), JSON.stringify(orders));
    renderOrders();
    window.dispatchEvent(new CustomEvent("levelup-cart-result", { detail: { message: `${product.product} добавлен в корзину.`, variant: "success" } }));
    return true;
  }

  window.addEventListener("levelup-auth", (event) => setUser(event.detail));
  setUser(window.levelUpUser);

  window.addEventListener("levelup-add-to-cart", (event) => {
    const product = event.detail;
    if (!product) return;
    addToCart({ product: product.title, price: `от ${product.price} сом` });
  });

  document.querySelectorAll(".game-card [data-modal='payment']").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".game-card");
      selectedProduct = {
        product: card.querySelector(".game-label")?.textContent || "Игра",
        price: card.querySelector("h3 + p")?.textContent?.replace("Стартовая цена: ", "") || "цена уточняется",
      };
      paymentTitle.textContent = selectedProduct.product;
      paymentDescription.textContent = `Стартовая цена: ${selectedProduct.price}. Добавьте игру в корзину, затем откройте кабинет для демо-оплаты.`;
      paymentFeedback.textContent = "";
      createOrderButton.textContent = currentUser ? "Добавить в корзину" : "Войти, чтобы добавить";
    });
  });

  window.addEventListener("levelup-select-product", (event) => {
    const product = event.detail;
    if (!product || !paymentModal) return;
    selectedProduct = { product: product.title, price: `от ${product.price} сом` };
    paymentTitle.textContent = selectedProduct.product;
    paymentDescription.textContent = `Стартовая цена: ${selectedProduct.price}. Добавьте игру в корзину, затем откройте кабинет для демо-оплаты.`;
    paymentFeedback.textContent = "";
    createOrderButton.textContent = currentUser ? "Добавить в корзину" : "Войти, чтобы добавить";
    paymentModal.showModal();
  });

  createOrderButton?.addEventListener("click", () => {
    if (!currentUser) {
      paymentModal.close();
      accountModal.showModal();
      return;
    }
    if (!selectedProduct) return;
    if (!addToCart(selectedProduct)) return;
    paymentFeedback.textContent = "Игра добавлена в корзину. Откройте полный кабинет для демо-оплаты.";
    createOrderButton.disabled = true;
    window.setTimeout(() => { createOrderButton.disabled = false; }, 800);
  });
})();
