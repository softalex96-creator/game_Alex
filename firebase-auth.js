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

const auth = getAuth(initializeApp(firebaseConfig));
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const accountModal = document.getElementById("account-modal");
const signInButton = document.getElementById("google-sign-in");
const steamSignInButton = document.getElementById("steam-sign-in");
const signOutButton = document.getElementById("google-sign-out");
const feedback = accountModal?.querySelector(".account-feedback");

function showAccountView(name) {
  accountModal?.querySelectorAll("[data-account-view]").forEach((view) => { view.hidden = view.dataset.accountView !== name; });
}

function setFeedback(message) { if (feedback) feedback.textContent = message; }

function signInMessage(error) {
  if (error.code === "auth/popup-closed-by-user") return "Вход отменён. Попробуйте ещё раз, когда будете готовы.";
  if (error.code === "auth/popup-blocked") return "Браузер заблокировал окно входа. Разрешите всплывающие окна для сайта и повторите попытку.";
  if (error.code === "auth/unauthorized-domain") return "Этот адрес сайта ещё не разрешён для входа. Откройте опубликованную версию LevelUp и повторите попытку.";
  return "Не удалось выполнить вход. Проверьте интернет‑соединение и повторите попытку.";
}

signInButton?.addEventListener("click", async () => {
  signInButton.disabled = true;
  setFeedback("Открываем защищённое окно Google…");
  try { await signInWithPopup(auth, provider); } catch (error) { setFeedback(signInMessage(error)); } finally { signInButton.disabled = false; }
});

steamSignInButton?.addEventListener("click", () => {
  setFeedback("Steam появится после подключения защищённого сервера авторизации. Ключи Steam не будут храниться в браузере.");
});

signOutButton?.addEventListener("click", async () => {
  try { await signOut(auth); setFeedback("Вы вышли из аккаунта."); } catch { setFeedback("Не удалось выйти из аккаунта. Попробуйте ещё раз."); }
});

onAuthStateChanged(auth, (user) => {
  window.levelUpUser = user;
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
});
