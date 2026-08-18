# LevelUp Steam Worker

The Worker verifies Steam OpenID and issues short-lived Firebase custom tokens. Secrets are set in Cloudflare and must never be committed:

- `ALLOWED_ORIGIN` — `https://gamemaster.cc`
- `STATE_SECRET` — a long random value
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`
