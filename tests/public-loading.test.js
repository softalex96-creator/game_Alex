import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cabinet = fs.readFileSync(new URL("../cabinet.html", import.meta.url), "utf8");
const authLoader = fs.readFileSync(new URL("../auth-loader.js", import.meta.url), "utf8");
const threeScene = fs.readFileSync(new URL("../three-scene.js", import.meta.url), "utf8");
const publicScript = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");
const cabinetScript = fs.readFileSync(new URL("../cabinet-page.js", import.meta.url), "utf8");
const turnstileLoader = fs.readFileSync(new URL("../turnstile-loader.js", import.meta.url), "utf8");

test("public index does not eagerly load Firebase Auth", () => {
  assert.doesNotMatch(index, /src=["']firebase-auth\.js/);
  assert.match(index, /src=["']auth-loader\.js/);
});

test("auth loader imports Firebase only when requested", () => {
  assert.match(authLoader, /import\(["']\.\/firebase-auth\.js/);
  assert.match(authLoader, /ensureLevelUpAuth/);
});

test("WebGL scene waits until its stage is visible", () => {
  assert.match(threeScene, /IntersectionObserver/);
});

test("public pages defer Turnstile until a protected action", () => {
  const turnstileApi = /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/;
  assert.doesNotMatch(index, turnstileApi);
  assert.doesNotMatch(cabinet, turnstileApi);
  assert.match(index, /src=["']turnstile-loader\.js/);
  assert.match(cabinet, /src=["']turnstile-loader\.js/);
  assert.match(turnstileLoader, /api\.js\?render=explicit/);
  assert.match(publicScript, /ensureTurnstile/);
  assert.match(cabinetScript, /ensureTurnstile/);
});

test("public pages version scripts that defer Turnstile", () => {
  assert.match(index, /src=["']script\.js\?v=lazy-turnstile-1["']/);
  assert.match(cabinet, /src=["']cabinet-page\.js\?v=lazy-turnstile-1["']/);
});
