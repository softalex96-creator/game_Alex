import assert from "node:assert/strict";
import test from "node:test";
import { createFkWalletPayment, signFkWalletRequest, signFkWalletWebhook } from "./fkwallet.js";

test("FKWallet API signature is independent of field order", () => {
  const first = signFkWalletRequest({ shopId: 777, nonce: 123, amount: "100.00" }, "secret");
  const second = signFkWalletRequest({ amount: "100.00", shopId: 777, nonce: 123 }, "secret");
  assert.equal(first, second); assert.match(first, /^[a-f0-9]{64}$/);
});

test("FKWallet webhook signature follows merchant callback format", () => {
  assert.equal(signFkWalletWebhook({ merchantId: "777", amount: "100.00", orderId: "LU1", secret: "secret2" }), "a73798e7055028fd48f4c91b1c306c66");
});

test("FKWallet order creation requests wallet payment method", async () => {
  let request;
  const fetchImpl = async (url, options) => { request = { url, body: JSON.parse(options.body) }; return { ok: true, json: async () => ({ type: "success", orderId: 123, orderHash: "hash", location: "https://pay.example/order" }) }; };
  const env = { FK_WALLET_SHOP_ID: "777", FK_WALLET_API_KEY: "api-secret", FK_WALLET_PAYMENT_SYSTEM_ID: "1" };
  const result = await createFkWalletPayment({ id: "LU1", amount: 1000, currency: "RUB", customer: { email: "user@example.com" } }, { customerIp: "203.0.113.10", fetchImpl, env });
  assert.equal(request.url, "https://api.fk.life/v1/orders/create"); assert.equal(request.body.i, 1); assert.equal(request.body.paymentId, "LU1");
  assert.equal(request.body.signature, signFkWalletRequest(request.body, "api-secret")); assert.equal(result.location, "https://pay.example/order");
});
