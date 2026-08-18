const modalNames = { account: "account-modal", payment: "payment-modal" };

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => document.getElementById(modalNames[button.dataset.modal]).showModal());
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.querySelectorAll(".close, .close-action").forEach((button) => button.addEventListener("click", () => modal.close()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
});
