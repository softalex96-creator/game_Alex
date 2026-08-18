# LevelUp Steam Worker

Secrets are set in Cloudflare and must never be committed:

- `ALLOWED_ORIGIN` — `https://softalex96-creator.github.io`
- `STATE_SECRET` — a long random value
- `FIREBASE_CLIENT_EMAIL` — Firebase service-account email
- `FIREBASE_PRIVATE_KEY` — Firebase service-account private key

The Worker redirects a player to Steam OpenID, verifies Steam's response server-side, and returns a Firebase custom token to the static callback page.
