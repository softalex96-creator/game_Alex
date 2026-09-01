import assert from "node:assert/strict";
import test from "node:test";
import { createWink2PayInvoice, hasValidWink2PaySignature, signWink2Pay } from "./wink2pay.js";

test("signature is stable regardless of request field order", () => {
  const first = signWink2Pay({ path: "/status", get: { order: "LU1", merchant_id: "merchant", endpoint_id: "endpoint" }, secret: "secret" });
  const second = signWink2Pay({ path: "/status", get: { endpoint_id: "endpoint", merchant_id: "merchant", order: "LU1" }, secret: "secret" });
  assert.equal(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
});

test("signature matches Wink2Pay normalization for booleans and omitted empty methods", () => {
  const signature = signWink2Pay({
    path: "/init",
    post: {
      amount: "1.00",
      currency: "RUB",
      device_browser_java_enabled: "True",
      endpoint_id: "endpoint",
      merchant_id: "merchant",
      order: "LU1",
      save_card: false,
    },
    secret: "test",
  });
  assert.equal(signature, "xU8wzTMfkClisqCnqte8PPKZxRlhtM0dR_eHIVZa8GY");
});

test("webhook verification excludes signature and uses timing-safe comparison", () => {
  const payload = { webhook_id: "event-1", order: "LU1", status: "complete", amount: "1000.0000" };
  payload.signature = signWink2Pay({ path: "/payments/wink2pay/webhook", post: payload, secret: "secret", webhook: true });
  assert.equal(hasValidWink2PaySignature(payload, { path: "/payments/wink2pay/webhook", secret: "secret" }), true);
  assert.equal(hasValidWink2PaySignature({ ...payload, status: "failed" }, { path: "/payments/wink2pay/webhook", secret: "secret" }), false);
});

test("invoice creation signs the exact body and preserves POST redirect data", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ status: "redirect", url: "https://pay.example/", method: "POST", form_data: { token: "abc" }, id: "invoice-1" }) };
  };
  const env = { WINK2PAY_MERCHANT_ID: "merchant", WINK2PAY_ENDPOINT_ID: "endpoint", WINK2PAY_API_SECRET: "secret", WINK2PAY_PAYMENT_METHOD: "pulse_sbp" };
  const result = await createWink2PayInvoice({ id: "LU1", amount: 1000, currency: "RUB", customer: { uid: "user", email: "user@example.com" }, finishUrl: "https://example.com/success", notificationUrl: "https://api.example.com/webhook" }, { fetchImpl, env });
  assert.equal(request.url, "https://secure-api.wink2paylink.com/init");
  assert.equal(request.body.payment_method, "pulse_sbp");
  assert.equal(request.body.device_browser_java_enabled, "True");
  assert.equal(request.body.save_card, false);
  assert.equal(request.body.signature, signWink2Pay({ path: "/init", post: request.body, secret: "secret" }));
  assert.deepEqual(result.form_data, { token: "abc" });
});
