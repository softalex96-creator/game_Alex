# Firebase auth proxy

This Cloudflare Worker makes Firebase Authentication helper pages first-party
for `gamemaster.cc`. Safari blocks the cross-site storage used by Firebase
redirect sign-in when the helper remains on `levelup-game-alex.firebaseapp.com`.

## Deploy

1. Copy `wrangler.toml.example` to `wrangler.toml` locally (do not commit credentials).
2. Deploy with `npx wrangler deploy cloudflare/firebase-auth-proxy.js --name gamemaster-firebase-auth-proxy`.
3. Attach these exact routes to the Worker:
   - `gamemaster.cc/__/auth/*`
4. Confirm `https://gamemaster.cc/__/auth/handler` no longer returns the GitHub Pages 404.
5. In Firebase Console, add `gamemaster.cc` to Authorized domains.
6. In Google Cloud OAuth client settings, add
   `https://gamemaster.cc/__/auth/handler` as an authorized redirect URI.
7. Only after steps 2–6 are live, change the web app `authDomain` to
   `gamemaster.cc`.

The Worker intentionally returns 404 for every path outside the two Firebase
helper namespaces; it is not an open proxy.
