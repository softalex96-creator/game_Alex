# LevelUp payment service

This small server is intentionally separate from the static GitHub Pages site.
It validates the selected catalog items on the server, creates a provider order,
receives payment callbacks, verifies Firebase users and sends transactional email
through Resend. Credentials belong only in `/opt/levelup/.env`
on the VPS.

For payment creation, the server keeps the exact BetaTransfer body-field order
in one array and uses that same array both to build the MD5 signature and to
send the form. The formula is `md5(concatenated_field_values + apiSecret)`:
there are no commas or other separators, and the API key is sent separately as
the `token` query parameter.

BetaTransfer webhooks use `md5(amount + orderId + apiSecret)`. The callback
accepts the provider's form-encoded notification, validates its signature and
order amount, then updates the order to `paid` only when the provider reports
success.

The frontend sends a Firebase ID token to `/users/register` and payment creation.
The server validates it with Firebase Identity Toolkit, stores only the verified
profile and sends the welcome email once. A verified paid callback creates one
persisted 16-digit delivery code and one idempotent Resend payment email.
