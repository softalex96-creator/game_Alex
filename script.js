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
