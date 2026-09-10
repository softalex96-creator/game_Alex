import test from "node:test";
import assert from "node:assert/strict";
import { isFirebaseAuthPath, buildFirebaseTarget } from "../cloudflare/firebase-auth-proxy.js";

test("allows only Firebase helper paths", () => {
  assert.equal(isFirebaseAuthPath("/__/auth/handler"), true);
  assert.equal(isFirebaseAuthPath("/__/auth/iframe"), true);
  assert.equal(isFirebaseAuthPath("/index.html"), false);
});

test("builds a fixed Firebase target", () => {
  assert.equal(
    buildFirebaseTarget(new URL("https://gamemaster.cc/__/auth/handler?mode=select" )).href,
    "https://levelup-game-alex.firebaseapp.com/__/auth/handler?mode=select",
  );
});
