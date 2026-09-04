import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ5Hp_AUCYWacBpoFysKpZeYLOmStCtfk",
  authDomain: "levelup-game-alex.firebaseapp.com",
  projectId: "levelup-game-alex",
  storageBucket: "levelup-game-alex.firebasestorage.app",
  messagingSenderId: "920434234588",
  appId: "1:920434234588:web:aa5bbdaf58b59610c25019",
};

export const auth = getAuth(initializeApp(firebaseConfig));
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
let idleTimer = null;
let sessionExpired = false;

function createSessionExpiredOverlay() {
  if (document.querySelector("[data-session-expired]")) return document.querySelector("[data-session-expired]");
  const overlay = document.createElement("section");
  overlay.className = "session-expired";
  overlay.dataset.sessionExpired = "true";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "session-expired-title");
  overlay.innerHTML = `<div class="session-expired__glow" aria-hidden="true"></div><div class="session-expired__card"><span class="session-expired__mark" aria-hidden="true">↗</span><p class="eyebrow">СЕССИЯ LEVELUP</p><h1 id="session-expired-title">Пауза затянулась</h1><p>Мы вышли из аккаунта, потому что ты долго не продолжал сессию. Так безопаснее для твоего профиля и заказов.</p><button class="button button-primary" type="button" data-session-login>Войти снова <span aria-hidden="true">→</span></button><small>Всё готово к возвращению — продолжим с места, где остановились.</small></div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-session-login]").addEventListener("click", () => {
    overlay.remove();
    sessionExpired = false;
    if (accountModal) { accountModal.showModal?.(); showAccountView("start"); }
    document.querySelector("[data-cabinet-login]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return overlay;
}

function clearIdleTimer() {
  if (idleTimer) window.clearTimeout(idleTimer);
  idleTimer = null;
}

function armIdleTimer(user) {
  clearIdleTimer();
  if (!user || sessionExpired) return;
  idleTimer = window.setTimeout(async () => {
    sessionExpired = true;
    createSessionExpiredOverlay();
    try { await signOut(auth); } catch { /* Keep the recovery screen visible even if the network is unavailable. */ }
  }, IDLE_TIMEOUT_MS);
}

["pointerdown", "keydown", "touchstart", "scroll"].forEach((eventName) => {
  window.addEventListener(eventName, () => { if (!sessionExpired && window.levelUpUser) armIdleTimer(window.levelUpUser); }, { passive: true });
});

const accountModal = document.getElementById("account-modal");
const signInButton = document.getElementById("google-sign-in");
const steamSignInButton = document.getElementById("steam-sign-in");
const signOutButton = document.getElementById("google-sign-out");
const feedback = accountModal?.querySelector(".account-feedback");

function showAccountView(name) {
  accountModal?.querySelectorAll("[data-account-view]").forEach((view) => { view.hidden = view.dataset.accountView !== name; });
}

function setFeedback(message) { if (feedback) feedback.textContent = message; }

export async function signInWithGoogle() { return signInWithPopup(auth, provider); }
export async function signOutLevelUp() { return signOut(auth); }

async function registerLevelUpUser(user) {
  const idToken = await user.getIdToken();
  const response = await fetch("https://api.gamemaster.cc/users/register", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    credentials: "omit",
  });
  if (!response.ok) throw new Error("Unable to register LevelUp user");
}

function signInMessage(error) {
  if (error.code === "auth/popup-closed-by-user") return "Вход отменён. Попробуйте ещё раз, когда будете готовы.";
  if (error.code === "auth/popup-blocked") return "Браузер заблокировал окно входа. Разрешите всплывающие окна для сайта и повторите попытку.";
  if (error.code === "auth/unauthorized-domain") return "Этот адрес сайта ещё не разрешён для входа. Откройте опубликованную версию LevelUp и повторите попытку.";
  return "Не удалось выполнить вход. Проверьте интернет‑соединение и повторите попытку.";
}

signInButton?.addEventListener("click", async () => {
  signInButton.disabled = true;
  setFeedback("Открываем защищённое окно Google…");
  try { await signInWithGoogle(); } catch (error) { setFeedback(signInMessage(error)); } finally { signInButton.disabled = false; }
});

steamSignInButton?.addEventListener("click", () => {
  window.location.assign("https://levelup-steam-auth.steam-worker.workers.dev/steam/login");
});

signOutButton?.addEventListener("click", async () => {
  try { await signOutLevelUp(); setFeedback("Вы вышли из аккаунта."); } catch { setFeedback("Не удалось выйти из аккаунта. Попробуйте ещё раз."); }
});

onAuthStateChanged(auth, (user) => {
  window.levelUpUser = user;
  armIdleTimer(user);
  window.dispatchEvent(new CustomEvent("levelup-auth", { detail: user }));
  if (!user) {
    showAccountView("start");
    return;
  }
  accountModal?.querySelectorAll("[data-user-name]").forEach((element) => { element.textContent = user.displayName || "Пользователь"; });
  accountModal?.querySelectorAll("[data-user-email]").forEach((element) => { element.textContent = user.email || ""; });
  accountModal?.querySelectorAll("[data-user-avatar]").forEach((image) => {
    if (!user.photoURL) return;
    image.src = user.photoURL;
    image.hidden = false;
  });
  showAccountView("profile");
  registerLevelUpUser(user).catch(() => {});
});
