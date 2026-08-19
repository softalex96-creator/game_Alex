(() => {
  const button = document.querySelector("[data-gta-interest]");
  const feedback = document.querySelector("[data-gta-feedback]");
  const key = "levelup-gta-vi-pc-interest";
  if (!button || !feedback) return;

  if (localStorage.getItem(key) === "true") {
    button.textContent = "Интерес сохранён";
    button.disabled = true;
    feedback.textContent = "Мы сохранили ваш интерес в этом браузере. Когда появится официальный канал и механизм уведомлений, этот раздел обновится.";
  }

  button.addEventListener("click", () => {
    localStorage.setItem(key, "true");
    button.textContent = "Интерес сохранён";
    button.disabled = true;
    feedback.textContent = "Готово: интерес сохранён в этом браузере. Сейчас никаких платежей и предзаказов не оформляется.";
  });
})();
