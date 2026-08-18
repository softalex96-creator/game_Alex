(() => {
  const products = window.levelUpProducts || [];
  const cards = [...document.querySelectorAll(".game-card")];
  const grid = document.querySelector(".game-grid");
  const search = document.querySelector("[data-catalog-search]");
  const result = document.querySelector("[data-catalog-result]");
  const infoModal = document.getElementById("game-info-modal");
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
  let toastTimer;
  const filters = { category: "all", platform: "all", genre: "all", publisher: "all", status: "all" };
  const genres = {
    warcraft: "RPG", "world-of-warcraft": "RPG", "counter-strike": "Экшен", cs2: "Экшен", "mobile-legends": "RPG", pubg: "Экшен", quake: "Экшен", "street-fighter": "Файтинг", "apex-legends": "Экшен", "ea-sports-fc": "Спорт", battlefield: "Экшен", "the-sims-4": "Симулятор", "need-for-speed": "Гонки", "ea-sports-f1": "Гонки", "plants-vs-zombies-2": "Стратегия", "star-wars-goh": "RPG", "real-racing-3": "Гонки", "madden-nfl-mobile": "Спорт", "tekken-8": "Файтинг", "elden-ring": "RPG", "dragon-ball-sparking-zero": "Файтинг", "dragon-ball-xenoverse-2": "Файтинг", "digimon-story": "RPG", "little-nightmares-iii": "Приключение", "code-vein-ii": "RPG", "tales-of-arise": "RPG", "ace-combat-7": "Экшен", "naruto-to-boruto": "Файтинг", "one-piece-pirate-warriors-4": "Файтинг", "pac-man": "Аркада"
  };

  function productOptions(product) {
    if (product.category === "currency") return ["Игровая валюта", "Наборы и бонусы", "Сезонные предметы"];
    if (product.category === "dlc") return ["Дополнения и DLC", "Персонажи или предметы", "Наборы игрового контента"];
    return [product.offer, "Игровой баланс или товары", "Подбор варианта через заявку"];
  }

  function showInfo(product, card) {
    if (!infoModal) return;
    infoModal.querySelector("[data-game-info-title]").textContent = product.title;
    infoModal.querySelector("[data-game-info-offer]").textContent = product.offer;
    infoModal.querySelector("[data-game-info-description]").textContent = product.description;
    infoModal.querySelector("[data-game-info-platform]").textContent = product.platform;
    infoModal.querySelector("[data-game-info-region]").textContent = product.region;
    infoModal.querySelector("[data-game-info-price]").textContent = `от ${product.price} сом`;
    const cover = card?.querySelector(".game-cover");
    const modalCover = infoModal.querySelector("[data-game-info-cover]");
    if (cover && modalCover) modalCover.style.backgroundImage = getComputedStyle(cover).backgroundImage;
    const list = infoModal.querySelector("[data-game-info-options]");
    list.replaceChildren(...productOptions(product).map((option) => {
      const item = document.createElement("li");
      item.textContent = option;
      return item;
    }));
    infoModal.querySelector("[data-game-info-details]").href = `product.html?id=${encodeURIComponent(product.id)}`;
    infoModal.querySelector("[data-game-info-add]").onclick = () => addToCart(product);
    infoModal.showModal();
  }

  function addToCart(product) {
    window.dispatchEvent(new CustomEvent("levelup-add-to-cart", { detail: product }));
  }

  function showToast(message, variant = "success") {
    toast.textContent = message;
    toast.dataset.variant = variant;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  cards.forEach((card, index) => {
    const product = products[index];
    if (!product) return;
    Object.assign(card.dataset, product, { genre: genres[product.id] || "Другое" });
    const button = card.querySelector("button");
    if (button) {
      const actions = document.createElement("div");
      actions.className = "game-card__actions";
      const details = document.createElement("button");
      details.className = "game-card__details";
      details.type = "button";
      details.textContent = "Подробнее";
      details.addEventListener("click", () => showInfo(product, card));
      const add = document.createElement("button");
      add.className = "game-card__add";
      add.type = "button";
      add.textContent = "В корзину +";
      add.addEventListener("click", () => addToCart(product));
      actions.append(details, add);
      button.replaceWith(actions);
    }
    const meta = document.createElement("div");
    meta.className = "game-card__meta";
    meta.innerHTML = `<span>${product.platform}</span><span>${product.publisher}</span>`;
    card.querySelector(".region-note")?.before(meta);
    const info = document.createElement("button");
    info.className = "game-card__info";
    info.type = "button";
    info.setAttribute("aria-label", `Информация об игре ${product.title}`);
    info.textContent = "i";
    info.addEventListener("click", () => showInfo(product, card));
    card.querySelector(".game-cover")?.append(info);
  });

  window.addEventListener("levelup-cart-result", (event) => {
    const result = event.detail || {};
    showToast(result.message || "Товар добавлен в корзину", result.variant || "success");
  });

  function matches(card) {
    const query = (search?.value || "").trim().toLowerCase();
    const text = `${card.dataset.title} ${card.dataset.offer} ${card.dataset.publisher} ${card.dataset.platform} ${card.dataset.genre}`.toLowerCase();
    return (!query || text.includes(query))
      && (filters.category === "all" || card.dataset.category === filters.category)
      && (filters.platform === "all" || card.dataset.platform === filters.platform)
      && (filters.genre === "all" || card.dataset.genre === filters.genre)
      && (filters.publisher === "all" || card.dataset.publisher === filters.publisher)
      && (filters.status === "all" || (filters.status === "featured" && card.dataset.badge) || card.dataset.badge === filters.status);
  }

  function applyFilters() {
    let visible = 0;
    cards.forEach((card) => {
      const show = matches(card);
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (result) result.textContent = `Найдено: ${visible} ${visible === 1 ? "игра" : visible < 5 ? "игры" : "игр"}`;
    if (grid) grid.classList.toggle("is-filtered", visible !== cards.length);
  }

  document.querySelectorAll("[data-filter]").forEach((control) => {
    control.addEventListener("click", () => {
      const key = control.dataset.filter;
      filters[key] = control.dataset.value;
      document.querySelectorAll("[data-collection]").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(`[data-filter="${key}"]`).forEach((item) => item.setAttribute("aria-pressed", String(item === control)));
      applyFilters();
    });
  });
  search?.addEventListener("input", applyFilters);
  document.querySelector("[data-catalog-reset]")?.addEventListener("click", () => {
    Object.keys(filters).forEach((key) => { filters[key] = "all"; });
    if (search) search.value = "";
    document.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.value === "all")));
    document.querySelectorAll("[data-collection]").forEach((item) => item.classList.remove("is-active"));
    applyFilters();
  });
  document.querySelectorAll("[data-collection]").forEach((collection) => {
    collection.addEventListener("click", () => {
      const selected = JSON.parse(collection.dataset.collection || "{}");
      Object.keys(filters).forEach((key) => { filters[key] = selected[key] || "all"; });
      document.querySelectorAll("[data-filter]").forEach((item) => {
        const active = filters[item.dataset.filter] === item.dataset.value;
        item.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll("[data-collection]").forEach((item) => item.classList.toggle("is-active", item === collection));
      applyFilters();
      grid?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const requestId = new URLSearchParams(window.location.search).get("product");
  if (requestId) {
    const product = products.find((item) => item.id === requestId);
    const card = cards.find((item) => item.dataset.id === requestId);
    if (product && card) {
      window.setTimeout(() => {
        card.querySelector(".game-card__actions")?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.dispatchEvent(new CustomEvent("levelup-select-product", { detail: product }));
      }, 180);
    }
  }
  applyFilters();
})();
