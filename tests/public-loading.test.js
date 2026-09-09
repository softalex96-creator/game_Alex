import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const authLoader = fs.readFileSync(new URL("../auth-loader.js", import.meta.url), "utf8");
const threeScene = fs.readFileSync(new URL("../three-scene.js", import.meta.url), "utf8");

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
