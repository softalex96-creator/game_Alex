import assert from "node:assert/strict";
import test from "node:test";
import { applyReferralReward, calculatePromotion, referralCodeForUid } from "./promotions.js";

test("LEVELUP5 gives five percent discount above the minimum order", () => {
  assert.deepEqual(calculatePromotion({ subtotal: 2000, promoCode: "levelup5", now: new Date("2026-09-04T00:00:00Z") }), { code: "LEVELUP5", type: "promo", discount: 100, total: 1900 });
});

test("TELEGRAM5 gives the channel discount", () => {
  assert.deepEqual(calculatePromotion({ subtotal: 2000, promoCode: "telegram5", now: new Date("2026-09-04T00:00:00Z") }), { code: "TELEGRAM5", type: "promo", discount: 100, total: 1900 });
});

test("expired or too-small promo orders are rejected", () => {
  assert.throws(() => calculatePromotion({ subtotal: 900, promoCode: "LEVELUP5", now: new Date("2026-09-04T00:00:00Z") }), /minimum/);
  assert.throws(() => calculatePromotion({ subtotal: 2000, promoCode: "NOPE", now: new Date("2026-09-04T00:00:00Z") }), /Unknown/);
});

test("referral gives the friend five percent and identifies the referrer", () => {
  const code = referralCodeForUid("referrer-1");
  assert.deepEqual(calculatePromotion({ subtotal: 2000, promoCode: code, customer: { uid: "friend-1", email: "friend@example.com" }, users: { "referrer-1": { uid: "referrer-1", email: "owner@example.com", referralCode: code } } }), { code, type: "referral", discount: 100, total: 1900, referrerUid: "referrer-1" });
});

test("self referrals and already-used referrals are rejected", () => {
  const code = referralCodeForUid("same-user");
  assert.throws(() => calculatePromotion({ subtotal: 2000, promoCode: code, customer: { uid: "same-user", email: "same@example.com" }, users: { "same-user": { uid: "same-user", email: "same@example.com", referralCode: code } } }), /your own/);
  assert.throws(() => calculatePromotion({ subtotal: 2000, promoCode: code, customer: { uid: "friend-1", email: "friend@example.com" }, users: { "referrer-1": { uid: "referrer-1", email: "owner@example.com", referralCode: code, referralRewards: [{ referredUid: "friend-1" }] } } }), /already/);
});

test("referrer receives one five-percent bonus after a paid order", () => {
  const users = { "referrer-1": { uid: "referrer-1", referralRewards: [] } };
  const promotion = { type: "referral", referrerUid: "referrer-1" };
  assert.equal(applyReferralReward(users, promotion, { uid: "friend-1", email: "friend@example.com" }, "LU-1"), true);
  assert.equal(users["referrer-1"].bonusBalance, 5);
  assert.equal(applyReferralReward(users, promotion, { uid: "friend-1", email: "friend@example.com" }, "LU-1"), false);
});
