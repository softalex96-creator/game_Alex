# LevelUp payment service

This small server is intentionally separate from the static GitHub Pages site.
It validates the selected catalog items on the server, creates a provider order,
and receives payment callbacks. Credentials belong only in `/opt/levelup/.env`
on the VPS.

Before enabling payments, obtain from BetaTransfer the exact MD5 signing field
order for both payment creation and callback verification. Do not guess it.
