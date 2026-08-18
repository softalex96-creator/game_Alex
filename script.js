const modalNames = { account: "account-modal", payment: "payment-modal" };

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => document.getElementById(modalNames[button.dataset.modal]).showModal());
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.querySelectorAll(".close, .close-action").forEach((button) => button.addEventListener("click", () => modal.close()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
});

const supportsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
