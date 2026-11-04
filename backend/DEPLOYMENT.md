# Sober Hub — Vercel + MySQL + Email Verification + Stripe Checkout

## Required Vercel variables
- `DB_HOST` — MySQL server hostname
- `DB_PORT` — MySQL server port, normally `3306`
- `DB_USER` — MySQL username
- `DB_PASSWORD` — MySQL password
- `DB_NAME` — MySQL database name, for example `sober_hub`
- `DEMO_MODE=false`
- `JWT_SECRET` — long random secret
- `STAFF_SIGNUP_CODE=SOBER-STAFF-2026`
- `APP_URL=https://YOUR-PROJECT.vercel.app`
- `RESEND_API_KEY` — Resend API key for verification/reset emails
- `EMAIL_FROM` — sender using a verified domain in Resend

## Email verification
New accounts are created as unverified. The API sends a 24-hour verification link. Users cannot log in until the link is used. Password reset also uses a one-hour email link.

For real email delivery, configure Resend and use a verified sending domain. Never commit the API key.

## Stripe test checkout
Set:
- `DEMO_PAYMENT_MODE=false`
- `STRIPE_SECRET_KEY=sk_test_...`
- `APP_URL=https://YOUR-PROJECT.vercel.app`

The membership page creates a Stripe Checkout Session in ZAR for R50, R75 or R100 and redirects the member to Stripe's secure hosted checkout. The success page verifies the Checkout Session server-side and activates the 30-day membership. The optional webhook remains available for asynchronous confirmation.

For a classroom demo without Stripe, keep `DEMO_PAYMENT_MODE=true`; this records a demo payment in MySQL without charging a card.

## PayFast and manual EFT
To enable PayFast, set `DEMO_PAYMENT_MODE=false`, then configure `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, and `PAYFAST_SANDBOX=true` for testing. Set `PAYFAST_PASSPHRASE` if one is configured on the merchant account. Set `APP_URL` to the public HTTPS site URL so PayFast can reach `${APP_URL}/api/payfast-itn`. PayFast's hosted checkout lists the payment methods enabled on your merchant account; EFT and wallet/mobile options depend on that account's setup. A verified ITN and PayFast server validation are required before membership activates.

To enable manual EFT, configure `MANUAL_EFT_BANK_NAME`, `MANUAL_EFT_ACCOUNT_NAME`, `MANUAL_EFT_ACCOUNT_NUMBER`, and `MANUAL_EFT_BRANCH_CODE`. Members receive the bank instructions and a unique reference; the payment remains pending until staff confirms it in the Staff Portal. Keep bank details and provider credentials in deployment environment variables, not source control.

## Database
The backend connects to MySQL without selecting a database, runs `CREATE DATABASE IF NOT EXISTS` for `DB_NAME`, then performs safe `CREATE TABLE IF NOT EXISTS` setup on its first database request. The MySQL account must have permission to create databases. You can also create the database and run `schema.sql` manually in MySQL Workbench.

For a local MySQL account with no password, leave `DB_PASSWORD` empty. Do not use an empty password in production.

## Health check
Open `/api/health`. A working connection returns `ok: true` and `database: connected`.
