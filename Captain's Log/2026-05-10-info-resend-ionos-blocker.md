---
type: "captains-log"
date: "2026-05-10"
slug: "info-resend-ionos-blocker"
status: "complete"
created: "2026-05-10"
---

# Captain's Log: Info Resend IONOS Blocker

> We chased Haley's "IONOS / Resend" dashboard comment until it became a real, narrow blocker: Dev Dashboard sending can reach Resend once app auth is fixed, but Resend will not send from `thenorthstarhouse.org` until the wrong DKIM TXT record is replaced in IONOS. IONOS access is blocked by `admin@thenorthstarhouse.org` mailbox recovery and 2FA.

## Status & Purpose

This started inside DDD triage for the May 7 post-meeting brief. The immediate question was whether the "Making info@ able to send emails through Dev Dashboard" task was actually addressed, ambiguous, or blocked.

We confirmed the brief and dashboard were mixing at least three separate things:

- Dev Dashboard sending through Supabase Edge Function + Resend.
- Constant Contact membership campaign sender/reply setup.
- Basic `info@thenorthstarhouse.org` inbox access and reply monitoring.

The point was to separate those so the team does not treat one blocker as proof that all email work is blocked.

## What Got Done

- Installed and authenticated `gws-info` so `info@thenorthstarhouse.org` mailbox can be checked locally.
- Accepted the Resend invite for `info@thenorthstarhouse.org`.
- Verified Resend team state:
  - Team: `thenorthstarhouse`
  - Only remaining API key: `Onboarding`
  - Domain: `northstarhouse.org`
  - Provider: `IONOS`
  - Status: `Failed`
- Confirmed Supabase already has `RESEND_API_KEY`, updated May 8, 2026.
- Confirmed `.env.local` is not the production fix. Dev Dashboard email uses Supabase Edge Function secrets, not local Next env.
- Tested the deployed `send-email` function:
  - Without auth headers: `401 UNAUTHORIZED_NO_AUTH_HEADER`.
  - With Supabase anon auth headers: function reaches Resend, then Resend returns `403` because `thenorthstarhouse.org` is not verified.
- Added a local code fix for the app-side auth problem:
  - `lib/send-email.ts`
  - `lib/supabase/client.ts`
  - `components/EmailGroupButton.tsx`
  - `app/volunteers/page.tsx`
- Verified `npm run build` passes.
- Ran targeted lint on touched files. No errors; one pre-existing warning in `app/volunteers/page.tsx`.
- Added `supabase` wrappers in `C:\Users\ender\bin` so `supabase` resolves through `npx supabase`.
- Installed the new `rewrite` skill from `endersclarity/vault-mirror` into `C:\Users\ender\.codex\skills\rewrite`.

## DNS Finding

The live DNS record exists but has the wrong DKIM public key:

- Record: `resend._domainkey.northstarhouse.org`
- Type: `TXT`
- Current value starts with the wrong key segment: `...KBgQDMB0xbp...`
- Resend target value starts with: `p=MIGfMA0GCSqG...KBgQC5pSM3...`
- Resend target value ends with: `...TrSYDV6POwIDAQAB`

The correct fix is to replace the existing TXT value. Do not add a duplicate `resend._domainkey` record.

## Current Blocker

IONOS login uses `admin@thenorthstarhouse.org`.

The IONOS password was accepted, but IONOS requires a six-digit email confirmation code sent to `admin@thenorthstarhouse.org`.

That mailbox is currently inaccessible because:

- The `admin@thenorthstarhouse.org` password was changed about three days before this session.
- Google sign-in for that mailbox requires 2FA.
- The 2FA code goes to a phone the user does not control.

So the DNS fix is blocked on recovering admin mailbox / 2FA access, or getting whoever controls IONOS/DNS to replace the DKIM record.

## Dashboard Updates

We updated `tasks.notes` in Supabase for:

- `Making info@ able to send emails through Dev Dashboard`
- `Define reply monitoring plan for membership emails`
- `Confirm Constant Contact sender address`

These notes were confirmed in Supabase, but the dashboard UI does not visibly render `tasks.notes` in the expanded task row.

Temporary visible `DDD` comments were added to those tasks, then removed at user direction. No visible task comments were left.

Rollback files:

- `sidecars/dashboard-task-rollback-2026-05-10T09-38-27-201Z.json`
- `sidecars/task-comments-rollback-2026-05-10T09-42-29-661Z.json`
- `sidecars/removed-ddd-comments-2026-05-10T09-44-44-948Z.json`

## Decisions

- Do not rotate or replace the existing Resend API key unless later testing proves it is invalid.
- Keep Resend / Dev Dashboard sending separate from Constant Contact membership sender setup.
- Treat `info@` inbox access as confirmed.
- Treat `admin@` / IONOS / DKIM as the actual hard blocker.
- Do not leave DDD-authored comments on Haley's dashboard; if visible comments are needed later, Kaelen should post them manually.
- Do not include the admin password in durable artifacts.

## Next Moves

1. Recover `admin@thenorthstarhouse.org` access or get the person who controls its 2FA phone involved.
2. Log into IONOS.
3. Replace the existing `resend._domainkey` TXT value with the target value shown in Resend.
4. Return to Resend and click `Restart` for `northstarhouse.org` verification.
5. Retest Dev Dashboard send path.
6. After DNS is verified, decide whether to add a visible human-authored dashboard comment.

## Risks & Dependencies

- DNS cannot be fixed without IONOS access.
- `admin@` recovery may require the phone owner or Google Workspace admin recovery.
- The local code fix for send auth is not deployed until committed/pushed/deployed.
- The dashboard caching layer can hide updates; `localStorage` key `north-star:tasks` may need clearing after DB updates.

## Threads We Noticed

- Constant Contact sender/reply setup still needs its own check, separate from Resend.
- Reply-monitoring plan can proceed if `info@` is the chosen inbox.
- DDD skill now needs to keep respecting Haley's dashboard constraints: comments are visible, task notes are not.
- `/rewrite` is now installed but requires restarting Codex to appear in the skill list.
