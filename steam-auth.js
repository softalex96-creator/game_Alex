import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInWithCustomToken, updateProfile } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ5Hp_AUCYWacBpoFysKpZeYLOmStCtfk",
  authDomain: "levelup-game-alex.firebaseapp.com",
  projectId: "levelup-game-alex",
  storageBucket: "levelup-game-alex.firebasestorage.app",
  messagingSenderId: "920434234588",
  appId: "1:920434234588:web:aa5bbdaf58b59610c25019",
};

const status = document.getElementById("steam-status");
const workerUrl = "https://levelup-steam-auth.steam-worker.workers.dev";

async function finishSteamLogin() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("openid.claimed_id") || !params.get("state")) throw new Error("Steam не передал подтверждение входа.");
  const response = await fetch(`${workerUrl}/steam/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: params.toString() }),
  });
  const result = await response.json();
  if (!response.ok || !result.token) throw new Error("Steam не подтвердил вход. Попробуйте ещё раз.");
  const auth = getAuth(initializeApp(firebaseConfig));
  const credential = await signInWithCustomToken(auth, result.token);
  const steamId = credential.user.uid.replace("steam:", "");
  await updateProfile(credential.user, { displayName: `Steam ${steamId}` });
  status.textContent = "Steam подключён. Возвращаемся в кабинет…";
  window.setTimeout(() => window.location.replace("/game_Alex/"), 700);
}

finishSteamLogin().catch((error) => {
  status.textContent = error.message || "Не удалось подключить Steam.";
});
