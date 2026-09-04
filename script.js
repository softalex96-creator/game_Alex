const modalNames = { account: "account-modal", payment: "payment-modal" };

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => document.getElementById(modalNames[button.dataset.modal]).showModal());
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.querySelectorAll(".close, .close-action").forEach((button) => button.addEventListener("click", () => modal.close()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
});

const accountModal = document.getElementById("account-modal");
if (accountModal) {
  const accountViews = accountModal.querySelectorAll("[data-account-view]");
  const feedback = accountModal.querySelector(".account-feedback");

  accountModal.querySelectorAll("[data-account-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      accountViews.forEach((view) => { view.hidden = view.dataset.accountView !== button.dataset.accountMode; });
      if (feedback) feedback.textContent = "";
    });
  });

}

const supportsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileMenuClose = document.querySelector("[data-mobile-menu-close]");

function setMobileMenu(open) {
  if (!mobileMenu || !mobileMenuToggle) return;
  mobileMenu.hidden = !open;
  mobileMenuToggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("mobile-menu-open", open);
  if (open) mobileMenuClose?.focus();
  else mobileMenuToggle.focus();
}

mobileMenuToggle?.addEventListener("click", () => setMobileMenu(mobileMenu?.hidden));
mobileMenuClose?.addEventListener("click", () => setMobileMenu(false));
mobileMenu?.addEventListener("click", (event) => {
  if (event.target === mobileMenu) setMobileMenu(false);
});
mobileMenu?.querySelectorAll("a, [data-modal]").forEach((control) => control.addEventListener("click", () => setMobileMenu(false)));
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !mobileMenu?.hidden) setMobileMenu(false); });

if (supportsMotion) {
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-x", `${(x - .5) * 7}deg`);
      card.style.setProperty("--tilt-y", `${(y - .5) * -7}deg`);
      card.style.setProperty("--glow-x", `${x * 100}%`);
      card.style.setProperty("--glow-y", `${y * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  });
}

const reviewsNote = document.querySelector(".reviews__note");
const playerDashboard = document.querySelector(".gta-status");
if (playerDashboard) {
  playerDashboard.classList.add("gta-player-dashboard");
  playerDashboard.setAttribute("aria-label", "Профиль игрока");
  playerDashboard.innerHTML = `<div class="gta-player-head"><span class="gta-avatar">LU</span><div><small>ТВОЙ ПРОФИЛЬ</small><strong>Новый игрок</strong></div><b>LVL 01</b></div><div class="gta-xp"><div><span>Прогресс уровня</span><strong>240 / 500 XP</strong></div><div class="gta-xp__track"><span></span></div><small>Ещё 260 XP до <b>Argentum</b></small></div><div class="gta-status__main"><span>СЛЕДУЮЩАЯ ЦЕЛЬ</span><strong>Открыть игровой мир</strong><small>Выбери товар в каталоге и добавь первый шаг в свой профиль.</small></div><a class="gta-status__cta" href="#catalog">Начать путь <span aria-hidden="true">→</span></a><div class="gta-status__chips"><span><b>30</b> миров</span><span><b>24/7</b> радар</span></div>`;
}
async function loadPublishedReviews() {
  const groups = [...document.querySelectorAll(".reviews__group")];
  if (!groups.length) return;
  try {
    const response = await fetch("https://api.gamemaster.cc/reviews", { cache: "no-store" });
    if (!response.ok) return;
    const { reviews = [] } = await response.json();
    reviews.slice(0, 12).forEach((review) => {
      const card = document.createElement("article");
      card.className = "review-card review-card--community";
      card.innerHTML = `<div><strong></strong><span></span></div><b aria-label="Рейтинг ${review.rating} из 5">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</b><p></p>`;
      card.querySelector("strong").textContent = review.displayName;
      card.querySelector("span").textContent = review.game || "LevelUp";
      card.querySelector("p").textContent = review.message;
      groups[0].append(card);
      const clone = card.cloneNode(true); clone.setAttribute("aria-hidden", "true"); groups[1]?.append(clone);
    });
  } catch { /* The static review feed remains available if the API is offline. */ }
}
loadPublishedReviews();
if (reviewsNote) {
  const reviewCompose = document.createElement("div");
  reviewCompose.className = "review-compose";
  reviewCompose.innerHTML = `<div class="review-compose__intro"><p class="eyebrow">Ваш ход</p><h3>Оставить отзыв</h3><p>Расскажите коротко, как всё прошло. После проверки отзыв появится в ленте.</p></div><form class="review-form" id="review-form" novalidate><div class="review-form__rating"><span id="review-rating-label">Ваша оценка</span><div class="review-stars" role="radiogroup" aria-labelledby="review-rating-label" aria-describedby="review-rating-error">${[1, 2, 3, 4, 5].map((value) => `<button type="button" role="radio" aria-checked="false" aria-label="${value} ${value === 1 ? "звезда" : value < 5 ? "звезды" : "звёзд"}" data-rating="${value}">★</button>`).join("")}</div><small class="review-form__error" id="review-rating-error"></small></div><div class="review-form__message"><label for="review-message">Ваш отзыв</label><textarea id="review-message" name="message" rows="3" minlength="5" maxlength="400" placeholder="Что понравилось? Как прошла покупка?" aria-describedby="review-message-hint review-message-error" required></textarea><div class="review-form__meta"><small id="review-message-hint">От 5 до 400 символов</small><small><span data-review-count>0</span>/400</small></div><small class="review-form__error" id="review-message-error"></small></div><button class="button button-primary review-form__submit" type="submit">Отправить отзыв</button><p class="review-form__status" role="status" aria-live="polite"></p></form>`;
  reviewsNote.before(reviewCompose);

  const reviewForm = reviewCompose.querySelector("#review-form");
  const stars = [...reviewForm.querySelectorAll("[data-rating]")];
  const message = reviewForm.querySelector("#review-message");
  const count = reviewForm.querySelector("[data-review-count]");
  const ratingError = reviewForm.querySelector("#review-rating-error");
  const messageError = reviewForm.querySelector("#review-message-error");
  const status = reviewForm.querySelector(".review-form__status");
  const submit = reviewForm.querySelector(".review-form__submit");
  let rating = 0;

  const paintStars = (value) => stars.forEach((star) => star.classList.toggle("is-active", Number(star.dataset.rating) <= value));
  const chooseRating = (value) => {
    rating = value;
    stars.forEach((star) => {
      const selected = Number(star.dataset.rating) === value;
      star.setAttribute("aria-checked", String(selected));
      star.tabIndex = selected ? 0 : -1;
    });
    paintStars(value);
    ratingError.textContent = "";
  };

  stars.forEach((star, index) => {
    star.tabIndex = index === 0 ? 0 : -1;
    star.addEventListener("click", () => chooseRating(Number(star.dataset.rating)));
    star.addEventListener("mouseenter", () => paintStars(Number(star.dataset.rating)));
    star.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
      const next = Math.min(5, Math.max(1, (rating || 1) + step));
      chooseRating(next);
      stars[next - 1].focus();
    });
  });
  reviewCompose.querySelector(".review-stars").addEventListener("mouseleave", () => paintStars(rating));
  message.addEventListener("input", () => {
    count.textContent = String(message.value.length);
    message.removeAttribute("aria-invalid");
    messageError.textContent = "";
    status.textContent = "";
  });
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = message.value.trim();
    ratingError.textContent = rating ? "" : "Поставьте оценку";
    messageError.textContent = text.length >= 5 ? "" : "Напишите хотя бы 5 символов";
    message.toggleAttribute("aria-invalid", text.length < 5);
    if (!rating || text.length < 5) {
      (rating ? message : stars[0]).focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Отправляем…";
    try {
      const user = window.levelUpUser;
      if (!user) throw new Error("auth");
      const response = await fetch("https://api.gamemaster.cc/reviews", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ rating, message: text }) });
      if (!response.ok) throw new Error("request");
      reviewForm.reset();
      rating = 0;
      paintStars(0);
      stars.forEach((star, index) => { star.setAttribute("aria-checked", "false"); star.tabIndex = index === 0 ? 0 : -1; });
      count.textContent = "0";
      submit.disabled = false;
      submit.textContent = "Отправить отзыв";
      status.textContent = "Спасибо! Отзыв отправлен на модерацию.";
    } catch {
      submit.disabled = false;
      submit.textContent = "Отправить отзыв";
      status.textContent = window.levelUpUser ? "Не удалось отправить отзыв. Попробуйте ещё раз." : "Сначала войдите в аккаунт.";
    }
  });
}
