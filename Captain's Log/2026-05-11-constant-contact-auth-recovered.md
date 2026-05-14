---
type: "captains-log"
date: "2026-05-11"
slug: "constant-contact-auth-recovered"
status: "complete"
created: "2026-05-11"
---

# Captain's Log: Constant Contact Auth Recovered

> Constant Contact API access was restored after diagnosing a stale refresh-token chain. The fix was a fresh browser OAuth flow, immediate `.env` persistence, and read-only verification against account, list, and campaign endpoints.

## Status & Purpose

The North Star Constant Contact API path was broken because local credentials in `C:\Users\ender\.claude\.env` had an expired access token and a stale refresh token. The working theory was refresh-token rotation: one refresh had succeeded in-memory earlier, but the new token pair was not written back to disk. Later attempts reused the old refresh token and returned `invalid_grant`.

The goal was to restore local read-only Constant Contact access for membership campaign work without sending email or mutating contacts.

## What Got Done

- Confirmed `.env` contains the Constant Contact client, login, access-token, refresh-token, and token-issued keys.
- Confirmed the old access token had expired and the stored refresh token returned `invalid_grant`.
- Built a durable OAuth recovery script at `scripts/cc_oauth_reauth.py`.
- Completed browser OAuth with the `nshc1905` Constant Contact login and callback URI `https://localhost:8443`.
- Updated `C:\Users\ender\.claude\.env` with fresh `CC_ACCESS_TOKEN`, `CC_REFRESH_TOKEN`, and `CC_TOKEN_ISSUED_AT`.
- Created backup `C:\Users\ender\.claude\.env.bak-1778475429`.
- Verified read-only API access:
  - Account summary returned `North Star Historic Conservancy`, encoded account id `a07egd3j8bb5dl`.
  - Contact lists endpoint returned 31 lists.
  - Campaigns endpoint returned 50 records from the first page.
  - Membership-related drafts were visible, including Brick Buyers, Cold, Warm, and the May 2 merge-test campaign.

## Decisions

- No sends during this recovery.
- No contact mutations during this recovery.
- Treat Context7-backed official Constant Contact docs as authority for OAuth request shape.
- Persist every refreshed Constant Contact token pair immediately; never rely on in-memory refreshed tokens.

## What Surprised Us

The first OAuth catcher handled only one request, so Chrome's local certificate interstitial could consume the listener before the real callback completed. The script now keeps listening until success, failure, or timeout.

The token endpoint rejected Python urllib's default request fingerprint with a 403 marketing HTML response. Adding a normal User-Agent and matching Constant Contact's documented token POST format fixed the exchange.

## Context7 Verification

Context7 source: `/websites/developer_constantcontact`, official Constant Contact V3 API docs.

Confirmed:

- Authorization-code exchange is `POST https://authz.constantcontact.com/oauth2/default/v1/token?code=...&redirect_uri=...&grant_type=authorization_code`.
- Refresh is `POST https://authz.constantcontact.com/oauth2/default/v1/token?refresh_token=...&grant_type=refresh_token`.
- Both use Basic auth with `client_id:client_secret`, `Content-Type: application/x-www-form-urlencoded`, and no request body.
- Refresh returns a new access token and a new refresh token.
- Read-only verification endpoints are `GET /v3/contact_lists`, `GET /v3/contacts`, and `GET /v3/emails`.

## Next Moves

- Use `scripts/cc_oauth_reauth.py` when Constant Contact tokens break again.
- For future automation, add a small refresh helper that writes rotated token pairs back to `C:\Users\ender\.claude\.env` atomically after every successful refresh.
- Return to the long-lapsed email-only renewal task now that Constant Contact read-only access works.

## Threads We Noticed

- The long-lapsed donor task is still blocked on source recovery and recipient verification, not DKIM.
- `sidecars/constant-contact-auth-recovery-2026-05-11.md` has the detailed technical trace.
- Token refresh handling should be treated as infrastructure, not one-off triage.
