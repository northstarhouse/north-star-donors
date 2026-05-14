# Drilldown sidecar - Constant Contact auth recovery
Date: 2026-05-11
Parent task: Restore Constant Contact API access for North Star campaign work
Session ceiling: Read-only Constant Contact API calls work again locally, or the one external authorization blocker is identified.

## Resolution

- Root issue: `.env` held an expired access token and a stale refresh token. A refresh succeeded earlier in-memory, but the rotated replacement token set was not persisted. Reusing the old refresh token then produced `invalid_grant`.
- Restored via browser OAuth using `https://localhost:8443` and the `nshc1905` Constant Contact login.
- Updated `C:\Users\ender\.claude\.env` with fresh `CC_ACCESS_TOKEN`, `CC_REFRESH_TOKEN`, and `CC_TOKEN_ISSUED_AT`.
- Backup created: `C:\Users\ender\.claude\.env.bak-1778475429`.
- Read-only proof passed:
  - Account summary: `North Star Historic Conservancy`, encoded account id `a07egd3j8bb5dl`.
  - Contact lists endpoint returned 31 lists.
  - Campaigns endpoint returned 50 records from the first page.
  - Membership campaign records visible, including `2026 Membership Email - Brick Buyers Touch 1 - Draft`, `2026 Membership Email - Cold Touch 1 - Draft`, `2026 Membership Email - Warm Touch 1 - Draft`, and `TEST - Membership Renewal Email Merge Test 2026-05-02`.

## Notes / observations

- Earlier in this session, one in-memory refresh succeeded and allowed read-only list/campaign calls.
- Because the refreshed token set was not written back, the file still holds the old expired access token and old refresh token.
- A later refresh attempt with the old refresh token returned `invalid_grant`, consistent with refresh-token rotation.
- No sends or contact mutations should happen during this drilldown.
- The first OAuth catcher was too brittle: it handled one request and exited, so Chrome's localhost certificate flow could consume the listener before the real callback completed.
- The token endpoint rejected Python urllib's default request fingerprint with a 403 marketing HTML response. Adding a normal User-Agent and using Constant Contact's documented query-string token POST fixed exchange.

## Gate candidates

- Merge: write fresh CC tokens to `.env` only after read-only proof.
- Promote: create a durable CC auth recovery script if manual auth is required.
- Drop: old stale token values after replacement.

## Durable artifact

- Script: `scripts/cc_oauth_reauth.py`
  - Reads `C:\Users\ender\.claude\.env`.
  - Starts HTTPS callback on `https://localhost:8443`.
  - Writes auth URL/status under `.cc-oauth`.
  - Persists new token pair only after successful token exchange.
  - Verifies `/account/summary` before marking success.

## Context7 verification

- Source checked: Context7 library `/websites/developer_constantcontact`, official Constant Contact V3 API docs.
- Confirmed OAuth server flow:
  - Authorization-code exchange uses `POST https://authz.constantcontact.com/oauth2/default/v1/token?code=...&redirect_uri=...&grant_type=authorization_code`.
  - Refresh uses `POST https://authz.constantcontact.com/oauth2/default/v1/token?refresh_token=...&grant_type=refresh_token`.
  - Both use `Authorization: Basic {base64 client_id:client_secret}` and `Content-Type: application/x-www-form-urlencoded`.
  - Token endpoint uses no request body.
  - Refresh returns a new `access_token` and a new `refresh_token`; both must be persisted immediately.
- Confirmed read-only endpoints:
  - `GET /v3/contact_lists` with Bearer token for lists.
  - `GET /v3/contacts` with Bearer token for contacts, including `email` and `lists` filters.
  - `GET /v3/emails` with Bearer token and `campaign_data` scope for campaigns.
