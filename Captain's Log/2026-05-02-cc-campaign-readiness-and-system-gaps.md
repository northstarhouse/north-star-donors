---
type: "captains_log"
date: "2026-05-02"
slug: "cc-campaign-readiness-and-system-gaps"
status: "complete"
tags: [constant-contact, deliverability, dkim, dashboard, initiatives, system-design]
---

# CC Campaign Readiness + Two System Gaps Surfaced

**TL;DR:** Constant Contact reactivation campaign is now technically ready to fire — OAuth tokens live, 1,491 contacts pulled, 11-recipient Long-Lapsed cohort locked, email HTML hosted on Supabase, test send to Kaelen verified rendering with no bounce. Real send to the 11 is BLOCKED on DKIM rollout for thenorthstarhouse.org (gated on identifying DNS access holder). Side quest: surfaced two real system gaps — (1) the dashboard's "fragmented tasks under no parent" problem and (2) "no skill exists for dashboard task ops" — captured both as draft notes for future grill-me sessions, deliberately did NOT build either now.

---

## What got done

### CC infrastructure
- **OAuth tokens live** in `~/.claude/.env` with rotation tested. Scopes: account_read + account_update + offline_access + campaign_data + contact_data. 24h refresh cycle.
- **1,491 CC contacts pulled** to `/tmp/cc-oauth/data/cc_contacts.json`
- **Verified senders inventory:**
  - admin@thenorthstarhouse.org — DEFAULT_FROM, REPLY_TO ✓
  - wyn@thenorthstarhouse.org — BILLING role only (can't send campaigns from)
  - development@thenorthstarhouse.org — CONFIRMED (auto-confirmed via Workspace routing)
  - media@thenorthstarhouse.org — UNCONFIRMED, verification email pending Haley click
- **Verification request also sent to admin@** for adding new senders, but Kaelen has no inbox access there — needs Haley to forward or add him

### Email design + assets
- **Long-Lapsed Email-Only Renewal HTML** drafted, image-hosting solved on Supabase, merge tag fixed to CC's `[[FIRSTNAME OR "Friend"]]` (not Liquid)
- **Hero photo + Kenneth signature** extracted from Renewal_Letter.pdf (Haley's proofed source), hosted on Supabase email-assets bucket
- **Side-by-side preview** at https://golden-onyx-7fnh.here.now/ (printed letter vs email render)
- **HTML hosted on Supabase** at email-assets bucket, single canonical URL pattern matches what Haley used for the PDF

### Test send (1 person)
- Created CC test list "TEST - Email Merge Test 2026-05-02" with Kaelen as only member
- Sent campaign 2026-05-02 16:13 UTC, no bounce, rendered correctly
- Found in Gmail All Mail but hidden from inbox view → recipient-side filter (Kaelen's account specifically), NOT a deliverability issue
- Real fix needed for production: DKIM Self-Authentication so other recipients land in inbox

### Deliverability research + DKIM plan
- Research fork mapped Google's Feb 2024 bulk-sender requirements
- Drafted DKIM rollout plan v1, /the-fool red-teamed and caught 10 issues, plan v2 written incorporating fixes
- Plan v2 lives at `_drafts/2026-05-02-dkim-rollout-plan.md`
- Hard gate before bulk send: identify human with DNS access for thenorthstarhouse.org

### Dashboard hygiene
- 5 dashboard tasks updated with proper status changes + `BLOCKED-BY:` cross-references
- 2 marked done (Email design polish, Interrogate CC API)
- 3 got rich notes capturing dependencies and current state

### Two system gaps captured (not built)
- **Initiatives / parent-task pattern:** `_drafts/2026-05-02-initiatives-collapse-pattern.md` — three schema options (separate table FK / self-referential parent_id / tag-prefix convention), UI sketch, why deferred
- **`/dashboard-tasks` skill gap:** `_drafts/2026-05-02-dashboard-task-management-skill.md` — proposes a skill that encodes schema, status enum, multi-tag conventions, BLOCKED-BY references, holistic-read patterns

## Why

Started this session intending to solve the unreachable-donor problem (79 donors with no mailable address). Through a chain of "now we need to test that, now we need to verify, now we need to actually fire it" — turned into surfacing the deliverability gap (DKIM missing on thenorthstarhouse.org) and the dashboard gap (fragmented tasks need parent containers). Both are bigger than originally scoped but worth knowing about now.

## What got decided

- **Don't send to 11 without DKIM.** /the-fool's verdict on DKIM rollout = GO-WITH-CHANGES, hard gate is DNS access. Sending without = 20-40% inbox-rate loss.
- **Initiatives parent-task pattern is real** — likely Pattern A (separate `initiatives` table + `tasks.initiative_id` FK). Deferred to dedicated session.
- **`/dashboard-tasks` skill is a real gap** — every session re-learns task schema. Worth a skill, deferred to dedicated session.
- **Bundle Haley check-in.** Multiple blockers all need her input (held-back-5 lapsed, media@ verify, admin@ inbox access, DNS holder for DKIM). One conversation, four asks.

## What's stuck / open

- **DKIM rollout** — gated on identifying DNS holder for thenorthstarhouse.org. Plan v2 ready to execute once that's known.
- **DMARC publish** — gated on DKIM completion (sequence reversal per /the-fool: DKIM first, then DMARC).
- **Send to 11 Long-Lapsed-Email-Only** — gated on DKIM verified passing in raw email headers.
- **Bricks email cowrite** — separate copy needed (cold-conversion, not renewal framing).
- **Current Donors list derivation + email** — gated on Haley confirming this cohort is in scope at all.
- **CC MyLibrary upload** — endpoint mapped (`/v3/mylibrary/files`), auth working, but multipart shape returns 500. Parked, Supabase hosting works as fallback.
- **Edge Function for durable token storage** — manual `~/.claude/.env` works for now; not durable for prod. Estimated 1-2hr session.
- **media@ verification** — link in Haley's inbox, awaiting click.
- **admin@ verification email access** — Kaelen has no inbox access, blocks adding new senders.

## Surprises

- **CC's MyLibrary upload returns 500 on every multipart shape tried** even with correct auth and scope. Endpoint clearly works (Wyn uploaded files via web UI; GET returns 200) but the field shape is undocumented. Five variants tried, all 500. Vercel has the same kind of "everything looks right, ships green, returns 404" pattern.
- **CC uses ROTATING refresh tokens** — old refresh_token DIES on use. Must write back the new one on every refresh or access lapses permanently. Easy to miss; would have broken silently in 24h if not caught.
- **Gmail's "labeled Inbox but hidden from inbox view"** is the textbook signature of a recipient-side filter with "Skip the Inbox" action. NOT a deliverability problem. Tried to fix it as one anyway (~20 min wasted) before research fork named it correctly.
- **The deploy ghost-chase** (separate captain's log) consumed ~50 min. Same root pattern as CC MyLibrary 500: multiple plausible explanations, jumped to wrong one, compounded with wrong fixes. Both: should have done the simplest verification first.

## Why this is a separate log from the deploy postmortem

Different facet. Deploy postmortem is internal infrastructure / process / "how to not do this again." This one is forward-looking system + outreach state — what's READY, what's BLOCKED, what we now KNOW about CC and our deliverability posture. Plus the two bigger system gaps (Initiatives, dashboard-tasks skill) that emerged during the work.

## What's next

- Pivot to design work this session (per Kaelen's call after writing this log)
- Telegram Haley with the bundled 4-ask conversation when she's available
- DKIM rollout when DNS access is identified — that unblocks the 11-send + propagates to all future sends
- Initiatives + `/dashboard-tasks` skill: two future grill-me sessions, in either order
