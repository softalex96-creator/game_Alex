# LevelUp payment service

This small server is intentionally separate from the static GitHub Pages site.
It validates the selected catalog items on the server, creates a provider order,
and receives payment callbacks. Credentials belong only in `/opt/levelup/.env`
on the VPS.

For payment creation, the server keeps the exact BetaTransfer body-field order
in one array and uses that same array both to build the MD5 signature and to
send the form. The formula is `md5(concatenated_field_values + apiSecret)`:
there are no commas or other separators, and the API key is sent separately as
the `token` query parameter.

BetaTransfer webhooks use a separate signature mechanism: `md5(amount +
orderId + webhookSecret)`. Keep callback processing disabled until the webhook
secret and the provider's exact callback payload have been configured.
