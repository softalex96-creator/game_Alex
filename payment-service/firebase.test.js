import assert from "node:assert/strict";
import test from "node:test";
import { verifyFirebaseIdToken } from "./firebase.js";

test("verified Firebase profile is returned from accounts lookup", async () => {
  process.env.FIREBASE_WEB_API_KEY = "test-firebase-key";
  const fetchImpl = async (url, options) => {
    assert.match(url, /accounts:lookup\?key=test-firebase-key$/);
    assert.deepEqual(JSON.parse(options.body), { idToken: "valid-token" });
    return { ok: true, json: async () => ({ users: [{ localId: "uid-1", email: "player@example.com", emailVerified: true, displayName: "Игрок" }] }) };
  };
  assert.deepEqual(await verifyFirebaseIdToken("valid-token", fetchImpl), { uid: "uid-1", email: "player@example.com", displayName: "Игрок" });
});

test("unverified Firebase profiles are rejected", async () => {
  process.env.FIREBASE_WEB_API_KEY = "test-firebase-key";
  const fetchImpl = async () => ({ ok: true, json: async () => ({ users: [{ localId: "uid-1", email: "player@example.com", emailVerified: false }] }) });
  await assert.rejects(() => verifyFirebaseIdToken("invalid-token", fetchImpl), /not verified/);
});
