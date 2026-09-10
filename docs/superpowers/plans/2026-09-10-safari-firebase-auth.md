# Safari Firebase Auth Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Google sign-in complete successfully in iPhone Safari while preserving the existing desktop sign-in flow.

**Architecture:** Keep Firebase Authentication as the identity system, but serve Firebase's auth helper endpoints from `gamemaster.cc` through a Cloudflare Worker route. Update the web app's Firebase `authDomain` to the first-party domain only after the proxy route is deployed and the Firebase/Google authorized-domain settings are verified.

**Tech Stack:** Static GitHub Pages site, Firebase Web Auth SDK 12.16.0, Cloudflare Worker, Wrangler, Node.js tests.

**Spec:** Production symptom reported by the owner: Google sign-in does not open or complete on iPhone Safari; desktop sign-in works. The live domain currently returns 404 for `/__/auth/handler`, `/__/auth/iframe`, and `/__/firebase/init.json`.

## Global Constraints

- Do not change `firebaseConfig.authDomain` before the first-party proxy is deployed and reachable.
- Preserve the current desktop popup flow and mobile redirect intent.
- Do not stage or modify the user's unrelated untracked assets and folders.
- Verify syntax, tests, and live helper endpoints before claiming the fix is complete.

---

### Task 1: Add a first-party Firebase auth proxy worker

**Files:**
- Create: `cloudflare/firebase-auth-proxy.js`
- Create: `cloudflare/wrangler.toml.example`
- Create: `cloudflare/README.md`
- Test: `tests/firebase-auth-proxy.test.js`

**Interfaces:**
- Consumes: Requests to `https://gamemaster.cc/__/auth/*` and `https://gamemaster.cc/__/firebase/init.json`.
- Produces: A worker that forwards only Firebase helper paths to `https://levelup-game-alex.firebaseapp.com`, preserving method, query string, and request body while preventing an open proxy.

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { isFirebaseAuthPath, buildFirebaseTarget } from "../cloudflare/firebase-auth-proxy.js";

test("allows only Firebase helper paths", () => {
  assert.equal(isFirebaseAuthPath("/__/auth/handler"), true);
  assert.equal(isFirebaseAuthPath("/__/auth/iframe"), true);
  assert.equal(isFirebaseAuthPath("/__/firebase/init.json"), true);
  assert.equal(isFirebaseAuthPath("/index.html"), false);
});

test("builds a fixed Firebase target", () => {
  assert.equal(
    buildFirebaseTarget(new URL("https://gamemaster.cc/__/auth/handler?mode=select" )).href,
    "https://levelup-game-alex.firebaseapp.com/__/auth/handler?mode=select",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/firebase-auth-proxy.test.js`

Expected: FAIL because `cloudflare/firebase-auth-proxy.js` does not exist.

- [ ] **Step 3: Write the minimal worker implementation**

Export `isFirebaseAuthPath` and `buildFirebaseTarget` for tests. In the default export, return `404` for every non-helper path; for allowed paths, clone the incoming request and fetch the fixed Firebase target. Copy response headers, add `Cache-Control: no-store`, and set `Access-Control-Allow-Origin` only to `https://gamemaster.cc`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/firebase-auth-proxy.test.js`

Expected: PASS with 2 passing tests.

- [ ] **Step 5: Add deployment instructions**

Document the worker name, the route `gamemaster.cc/__/auth/*` plus `gamemaster.cc/__/firebase/init.json`, and the required Firebase Console settings. Include a warning not to change `authDomain` until the route is live.

- [ ] **Step 6: Commit**

```bash
git add cloudflare tests/firebase-auth-proxy.test.js
git commit -m "Add first-party Firebase auth proxy worker"
```

### Task 2: Switch Firebase auth to the first-party domain

**Files:**
- Modify: `firebase-auth.js`
- Modify: `auth-loader.js`
- Modify: `cabinet-page.js`
- Modify: `index.html`
- Test: `tests/public-loading.test.js`

**Interfaces:**
- Consumes: A deployed proxy at `https://gamemaster.cc/__/auth/*`.
- Produces: Firebase initialization using `authDomain: "gamemaster.cc"` and cache-busted auth modules.

- [ ] **Step 1: Add a failing configuration assertion**

Extend the existing public-loading test to assert that `firebase-auth.js` contains `authDomain: "gamemaster.cc"` and that all auth imports use the same cache-bust value.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/public-loading.test.js`

Expected: FAIL on the current `levelup-game-alex.firebaseapp.com` auth domain.

- [ ] **Step 3: Change the auth domain and cache-bust**

Set `firebaseConfig.authDomain` to `gamemaster.cc`, retain mobile redirect selection, and increment the auth cache-bust query consistently in `index.html`, `auth-loader.js`, and `cabinet-page.js`.

- [ ] **Step 4: Run focused verification**

Run: `node --test tests/public-loading.test.js && node --check firebase-auth.js && node --check auth-loader.js && git diff --check`

Expected: exit code 0 with all tests passing.

- [ ] **Step 5: Commit**

```bash
git add firebase-auth.js auth-loader.js cabinet-page.js index.html tests/public-loading.test.js
git commit -m "Use first-party domain for Firebase auth"
```

### Task 3: Deploy and verify production configuration

**Files:**
- Modify: Firebase Console authorized domains and Google OAuth redirect URIs.
- Modify: Cloudflare Worker deployment and route configuration.

**Interfaces:**
- Consumes: The worker files from Task 1 and the app change from Task 2.
- Produces: A live first-party Firebase auth helper path and a successful iPhone Safari sign-in return.

- [ ] **Step 1: Deploy the worker without changing site code**

Deploy the worker and attach the two exact routes. Verify `https://gamemaster.cc/__/auth/handler` no longer returns GitHub Pages 404.

- [ ] **Step 2: Configure Firebase and Google OAuth**

Add `gamemaster.cc` as an authorized Firebase domain and add `https://gamemaster.cc/__/auth/handler` as an authorized redirect URI for the Google web client.

- [ ] **Step 3: Publish the app auth-domain change**

Publish the commit from Task 2 through the existing GitHub Pages workflow.

- [ ] **Step 4: Verify both flows**

Test desktop Google sign-in, mobile redirect start, redirect return, Firebase session state, and `/api/users/register`. Record any provider error code instead of masking it.

- [ ] **Step 5: Commit deployment notes**

Record the deployed worker name and route patterns in `cloudflare/README.md` without storing credentials or tokens.

