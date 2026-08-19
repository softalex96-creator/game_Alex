(() => {
  const product = (window.levelUpProducts || []).find((item) => item.id === new URLSearchParams(location.search).get("id"));
  const page = document.querySelector("[data-product-page]");
  if (!product || !page) {
    location.replace("index.html#catalog");
    return;
  }
  document.title = `${product.title} — LevelUp`;
  page.querySelector("[data-product-title]").textContent = product.title;
  page.querySelector("[data-product-offer]").textContent = product.offer;
  page.querySelector("[data-product-description]").textContent = product.description;
  page.querySelector("[data-product-platform]").textContent = product.platform;
  page.querySelector("[data-product-publisher]").textContent = product.publisher;
  page.querySelector("[data-product-region]").textContent = product.region;
  page.querySelector("[data-product-price]").textContent = product.price > 0 ? `от ${product.price.toLocaleString("ru-RU")} ₽` : "Недоступно";
  const options = page.querySelector("[data-product-options]");
  if (product.options?.length) {
    options.replaceChildren(...product.options.map((option) => {
      const item = document.createElement("li");
      item.textContent = `${option.name} · от ${option.price.toLocaleString("ru-RU")} ₽`;
      return item;
    }));
  } else {
    const item = document.createElement("li");
    item.textContent = "Официальные покупки для этой игры завершены или недоступны.";
    options.replaceChildren(item);
  }
  const visual = page.querySelector("[data-product-visual]");
  const index = (window.levelUpProducts || []).indexOf(product) + 1;
  visual.classList.add(`product-visual--${index}`);
  visual.dataset.mark = product.title.split(/\s|:/)[0].slice(0, 3).toUpperCase();
  page.querySelector("[data-product-request]").href = `index.html?product=${encodeURIComponent(product.id)}#catalog`;
})();
