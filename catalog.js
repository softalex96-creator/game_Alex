(() => {
  const products = window.levelUpProducts || [];
  const allCards = [...document.querySelectorAll(".game-card")];
  const cards = allCards.slice(0, products.length);
  allCards.slice(products.length).forEach((card) => card.remove());
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
    "gta-vi": "Экшен", "world-of-warcraft": "RPG", "mobile-legends": "RPG", "pubg-mobile": "Экшен", "pubg-battlegrounds": "Экшен", "genshin-impact": "RPG", "honkai-star-rail": "RPG", "zenless-zone-zero": "Экшен", "wuthering-waves": "RPG", valorant: "Экшен", roblox: "Приключение", minecraft: "Приключение", fortnite: "Экшен", "brawl-stars": "Экшен", "clash-royale": "Стратегия", "clash-of-clans": "Стратегия", "marvel-rivals": "Экшен", "league-of-legends": "RPG", "apex-legends": "Экшен", "delta-force": "Экшен", "arena-breakout": "Экшен", "free-fire": "Экшен", steam: "Каталог", "afk-journey": "RPG", "honor-of-kings": "RPG", nikke: "RPG", "identity-v": "Приключение", "love-and-deepspace": "RPG", tarisland: "RPG", "pubg-new-state": "Экшен"
  };
  const coverImages = {
    "gta-vi": "gta-vi.jpg",
    "world-of-warcraft": "world-of-warcraft.jpg",
    "mobile-legends": "mobile-legends.jpg",
    "pubg-mobile": "pubg-mobile.jpg",
    "pubg-battlegrounds": "pubg-battlegrounds.jpg",
    "genshin-impact": "genshin-impact.jpg",
    "honkai-star-rail": "honkai-star-rail.jpg",
    "zenless-zone-zero": "zenless-zone-zero.jpg",
    "wuthering-waves": "wuthering-waves.jpg",
    valorant: "valorant.jpg",
    roblox: "roblox.jpg",
    minecraft: "minecraft.jpg",
    fortnite: "fortnite.jpg",
    "brawl-stars": "brawl-stars.jpg",
    "clash-royale": "clash-royale.jpg",
    "marvel-rivals": "marvel-rivals.jpg",
    "league-of-legends": "league-of-legends.jpg",
    "apex-legends": "apex-legends.jpg",
    "delta-force": "delta-force.jpg",
    "honor-of-kings": "honor-of-kings.jpg"
  };

  function productOptions(product) {
    return (product.options || []).filter((option) => option.price >= 1000);
  }

  function rubPrice(amount) {
    return amount > 0 ? `${new Intl.NumberFormat("ru-RU").format(amount)} ₽` : "Недоступно";
  }

  function cartIcon() {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "button-cart-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.innerHTML = '<path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L20 8H7"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>';
    return icon;
  }

  function setBuyLabel(button) {
    button.replaceChildren(cartIcon(), document.createTextNode("Купить"));
  }

  function showInfo(product, card) {
    if (!infoModal) return;
    infoModal.querySelector("[data-game-info-title]").textContent = product.title;
    infoModal.querySelector("[data-game-info-offer]").textContent = product.offer;
    infoModal.querySelector("[data-game-info-description]").textContent = product.description;
    infoModal.querySelector("[data-game-info-platform]").textContent = product.platform;
    infoModal.querySelector("[data-game-info-region]").textContent = product.region;
    infoModal.querySelector("[data-game-info-price]").textContent = rubPrice(product.price);
    const cover = card?.querySelector(".game-cover");
    const modalCover = infoModal.querySelector("[data-game-info-cover]");
    if (cover && modalCover) modalCover.style.backgroundImage = getComputedStyle(cover).backgroundImage;
    const list = infoModal.querySelector("[data-game-info-options]");
    const addButton = infoModal.querySelector("[data-game-info-add]");
    const options = productOptions(product);
    const title = infoModal.querySelector("[data-game-info-options-title]");
    list.replaceChildren();
    if (product.archived) {
      title.textContent = "Архив витрины";
      const notice = document.createElement("p");
      notice.className = "game-info-modal__empty";
      notice.textContent = "Эта карточка сохранена для навигации по каталогу. Новые покупки по ней пока не принимаются.";
      list.append(notice);
      addButton.disabled = true;
      addButton.textContent = "В архиве";
      infoModal.querySelector("[data-game-info-details]").href = `product.html?id=${encodeURIComponent(product.id)}`;
      infoModal.showModal();
      return;
    }
    if (product.id === "gta-vi") {
      title.textContent = "Статус PC-версии";
      const notice = document.createElement("p");
      notice.className = "game-info-modal__empty";
      notice.textContent = "Продажа и предзаказ PC-версии не открыты: Rockstar пока не объявила платформу, дату или отдельный онлайн-режим для PC. Мы не принимаем оплату за GTA VI.";
      list.append(notice);
      addButton.disabled = false;
      addButton.textContent = "Открыть PC-радар";
      addButton.onclick = () => { location.href = "gta-vi.html"; };
      infoModal.querySelector("[data-game-info-details]").href = "gta-vi.html";
      infoModal.showModal();
      return;
    }
    if (!options.length) {
      title.textContent = "Статус предложения";
      const notice = document.createElement("p");
      notice.className = "game-info-modal__empty";
      notice.textContent = "Официальные покупки для этой игры больше недоступны. Мы не добавляем заменители или неофициальные услуги.";
      list.append(notice);
      addButton.disabled = true;
      addButton.textContent = "Недоступно";
    } else {
      title.textContent = "Выберите товары";
      addButton.disabled = false;
      setBuyLabel(addButton);
      options.forEach((option, index) => {
        const label = document.createElement("label");
        label.className = "game-info-option";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = option.name;
        input.checked = index === 0;
        const copy = document.createElement("span");
        copy.innerHTML = `<strong>${option.name}</strong><small>${rubPrice(option.price)}</small>`;
        label.append(input, copy);
        list.append(label);
      });
    }
    infoModal.querySelector("[data-game-info-details]").href = `product.html?id=${encodeURIComponent(product.id)}`;
    addButton.onclick = () => {
      const selected = [...list.querySelectorAll("input:checked")].map((input) => input.value);
      if (!selected.length) {
        showToast("Выберите хотя бы один вариант", "warning");
        return;
      }
      selected.forEach((name) => {
        const option = options.find((item) => item.name === name);
        addToCart({ ...product, title: `${product.title} — ${name}`, price: option?.price || product.price, optionIndex: product.options.indexOf(option) });
      });
      infoModal.close();
    };
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
    // Static card markup has legacy labels; clear them when the current product has none.
    card.dataset.badge = product.badge || "";
    const cover = card.querySelector(".slot-cover");
    if (cover) {
      cover.dataset.mark = product.mark || product.title.slice(0, 3).toUpperCase();
      const image = coverImages[product.id];
      if (image) cover.style.setProperty("background-image", `url("assets/game-covers/${image}")`, "important");
    }
    const label = card.querySelector(".game-label");
    const offer = card.querySelector("h3");
    const price = card.querySelector("h3 + p");
    const region = card.querySelector(".region-note");
    if (label) label.textContent = product.title;
    if (offer) offer.textContent = product.offer;
    if (price) price.textContent = rubPrice(product.price);
    if (region) region.textContent = product.region;
    card.classList.toggle("game-card--featured", Boolean(product.featured));
    card.classList.toggle("game-card--archive", Boolean(product.archived));
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
      if (product.archived) {
        add.textContent = "В архиве";
        add.disabled = true;
      } else if (product.id === "gta-vi") {
        add.textContent = "PC-радар";
        add.addEventListener("click", () => { location.href = "gta-vi.html"; });
      } else {
        setBuyLabel(add);
        add.addEventListener("click", () => showInfo(product, card));
      }
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
      && (filters.status === "all" || (filters.status === "featured" && card.dataset.badge) || (filters.status === "archive" && card.dataset.archived === "true") || card.dataset.badge === filters.status);
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
