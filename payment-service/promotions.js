import crypto from "node:crypto";

export const PROMO_MINIMUM_SUBTOTAL = 1000;
const PROMO_CODES = { LEVELUP5: { percent: 5, minimum: PROMO_MINIMUM_SUBTOTAL } };

export function referralCodeForUid(uid) {
  return `LU-${crypto.createHash("sha256").update(String(uid)).digest("hex").slice(0, 8).toUpperCase()}`;
}

function discountFor(subtotal, percent) { return Math.min(subtotal, Math.floor(subtotal * percent / 100)); }

export function calculatePromotion({ subtotal, promoCode = "", customer = null, users = {}, now = new Date() }) {
  const amount = Number(subtotal);
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Invalid subtotal");
  const code = String(promoCode || "").trim().toUpperCase();
  if (!code) return { code: null, type: null, discount: 0, total: amount };
  const promo = PROMO_CODES[code];
  if (promo) {
    if (amount < promo.minimum) throw new Error("Promo requires minimum order amount");
    if (promo.expiresAt && new Date(now) >= new Date(promo.expiresAt)) throw new Error("Promo is expired");
    const discount = discountFor(amount, promo.percent);
    return { code, type: "promo", discount, total: amount - discount };
  }
  const referrer = Object.values(users).find((user) => String(user.referralCode || "").toUpperCase() === code);
  if (!referrer) throw new Error("Unknown promo code");
  if (!customer?.uid) throw new Error("Customer is required for referral");
  if (referrer.uid === customer.uid || String(referrer.email || "").toLowerCase() === String(customer.email || "").toLowerCase()) throw new Error("You cannot use your own referral code");
  const used = (referrer.referralRewards || []).some((reward) => reward.referredUid === customer.uid || (reward.referredEmail && reward.referredEmail.toLowerCase() === String(customer.email || "").toLowerCase()));
  if (used) throw new Error("Referral reward was already used");
  if (amount < PROMO_MINIMUM_SUBTOTAL) throw new Error("Referral requires minimum order amount");
  const discount = discountFor(amount, 5);
  return { code, type: "referral", discount, total: amount - discount, referrerUid: referrer.uid };
}

export function applyReferralReward(users, promotion, customer, orderId, now = new Date()) {
  if (!promotion?.referrerUid || promotion.type !== "referral") return false;
  const referrer = users[promotion.referrerUid];
  if (!referrer) return false;
  referrer.referralRewards ||= [];
  if (referrer.referralRewards.some((reward) => reward.orderId === orderId || reward.referredUid === customer.uid)) return false;
  referrer.referralRewards.push({ orderId, referredUid: customer.uid, referredEmail: customer.email, bonusPercent: 5, createdAt: new Date(now).toISOString() });
  referrer.bonusBalance = Number(referrer.bonusBalance || 0) + 5;
  return true;
}
