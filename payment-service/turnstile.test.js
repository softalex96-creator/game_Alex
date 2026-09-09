import test from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstileToken } from "./turnstile.js";

test("accepts a valid Turnstile response for gamemaster.cc", async () => {
  const result = await verifyTurnstileToken("valid-token", {
    secret: "secret",
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, "POST");
      assert.match(String(options.body), /secret=secret/);
      return new Response(JSON.stringify({ success: true, hostname: "gamemaster.cc" }), { status: 200 });
    },
  });
  assert.equal(result.hostname, "gamemaster.cc");
});

test("rejects an unsuccessful or foreign-host response", async () => {
  await assert.rejects(
    verifyTurnstileToken("valid-token", {
      secret: "secret",
      fetchImpl: async () => new Response(JSON.stringify({ success: true, hostname: "evil.example" }), { status: 200 }),
    }),
    /verification failed/
  );
});

test("rejects missing or malformed tokens", async () => {
  await assert.rejects(verifyTurnstileToken("", { secret: "secret", fetchImpl: async () => { throw new Error("must not call"); } }), /token is invalid/);
  await assert.rejects(verifyTurnstileToken("valid-token", { fetchImpl: async () => { throw new Error("must not call"); } }), /not configured/);
});
