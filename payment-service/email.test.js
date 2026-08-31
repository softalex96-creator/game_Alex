import assert from "node:assert/strict";
import test from "node:test";
import { createDeliveryCode, formatDeliveryCode, paymentEmail, sendPaymentEmail, sendWelcomeEmail } from "./email.js";

test("delivery codes contain exactly 16 decimal digits", () => {
  const code = createDeliveryCode();
  assert.match(code, /^\d{16}$/);
  assert.match(formatDeliveryCode(code), /^\d{4} \d{4} \d{4} \d{4}$/);
});

test("payment email includes the persisted code and escapes item titles", () => {
  const message = paymentEmail({ id: "LU12345678abcdef12", amount: 1200, deliveryCode: "1234567890123456", customer: { email: "player@example.com" }, items: [{ title: "Game <script>", price: 1200 }] });
  assert.match(message.text, /1234 5678 9012 3456/);
  assert.doesNotMatch(message.html, /Game <script>/);
  assert.match(message.html, /Game &lt;script&gt;/);
});

test("Resend requests use stable idempotency keys", async () => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.MAIL_FROM = "LevelUp <test@example.com>";
  const requests = [];
  const fetchImpl = async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ id: "email-1" }) }; };
  await sendWelcomeEmail({ uid: "firebase-user", email: "player@example.com", displayName: "Игрок" }, fetchImpl);
  await sendPaymentEmail({ id: "LU12345678abcdef12", amount: 1200, deliveryCode: "1234567890123456", customer: { email: "player@example.com" }, items: [{ title: "Game", price: 1200 }] }, fetchImpl);
  assert.equal(requests[0].options.headers["Idempotency-Key"], "welcome-firebase-user");
  assert.equal(requests[1].options.headers["Idempotency-Key"], "payment-LU12345678abcdef12");
});
