---
type: "captains_log"
date: "2026-05-03"
slug: "membership-renewal-task-walkthrough"
status: "complete"
tags: [constant-contact, dkim, deliverability, dashboard, membership-renewal, decision-log]
---

# Membership Renewal Walkthrough — Sharpened Asks, Decisions, Next Move

**TL;DR:** Walked through the 22-task Membership Renewal initiative one-by-one with brain-dump style updates. Net result: Haley conversation reduced from 6 vague asks to 2 sharp ones (envelope-stuffing-party status + Cloudflare login holder). DNS provider identified ourselves (Cloudflare). DKIM understood properly = trust signal not switch — small effect for tiny warm cohorts. Current Donors scope LOCKED (in for this campaign, framing = thank-you + upcoming-things, NOT renewal). DKIM no longer a hard blocker for the 11-send; replaced by empirical test-send to clean Gmail. Next concrete move: fire one CC test send to a non-Kaelen Gmail with no NSH filters, see where it lands, decide whether to ship the 11.

---

## What got done

### Task `1ca92a79` Haley check-in — sharpened from 6 asks to 2
- Dropped fabricated 5-name list (Brendan Clifford, Fran Logue, etc) — those names came from upstream session captures and weren't verifiable. Replaced with generic "envelopes that didn't get addressed at the Apr 30 mail-stuffing party" framing.
- Removed (b) media@ verification — moved to Kaelen-side (verification email goes to admin@ not media@; Haley reportedly already approved per text; just need to check admin@ inbox).
- Removed (c) admin@ access — RESOLVED (Haley sent creds via Accounts Master List doc, in `.env` as `NSH_EMAIL_ADMIN_PASSWORD`).
- Removed (e) Current Donors scope — RESOLVED before conversation by Kaelen confirmation.
- Sharpened (d) DNS access from "who has DNS for thenorthstarhouse.org?" to "who has the **Cloudflare** account login for thenorthstarhouse.org?" after we ran `dig +short ns` ourselves.
- Effective conversation now: (a) envelopes status + (d) Cloudflare login. That's it.

### Task `5a93ccbd` Derive Current Donors — UNBLOCKED
- Kaelen confirmed Current Donors are in this campaign batch.
- Framing locked: thank-you + inform-of-upcoming-things, NOT renewal-reactivation.
- `blocked_by` cleared (Haley dependency removed).
- Next: derive list (donors with 2025/2026 donation NOT in lapsed/long-lapsed/bricks), match against CC, /cowrite the copy.

### Task `775e459e` DKIM rollout — path crystallized
- DNS provider identified by ourselves: **Cloudflare** (via `dig` + WHOIS). Registrar: Cloudflare, nameservers: maisie + mack.
- Cloudflare credential NOT in `.env`, NOT in NSH Accounts Master List doc → real ask for Haley.
- Path = ~13 minutes active human time + 1-7 days calendar (DNS propagation + optional reputation wait).
- DKIM understood properly: it's a **trust signal**, not a binary switch. For warm 11-person cohort the effect is small. For Bricks (~25, colder) and Current Donors (~99) it matters more.

### Task `64e52fd4` Send to 11 — DKIM-blocker reframed
- Working hypothesis updated: DKIM impact for an 11-person warm cohort is a small nudge, not a hard requirement.
- Engagement history likely outweighs missing signature.
- Replaced "wait for DKIM" with "test-send to clean Gmail first, then decide."

## Why

Kaelen lost the thread on what was actually current vs stale, and asked to walk through the dashboard tasks one at a time to brain-dump and re-anchor. The approach worked — within ~30 minutes the Membership Renewal initiative state went from "vague mass of stuck things" to "specific blockers identified, most of which we can either resolve ourselves or that have small workarounds."

## What got decided

- **Current Donors get an email this campaign.** Framing = thank-you + upcoming-things. Not renewal copy.
- **DKIM is no longer a hard blocker for the 11-send.** Conditional on the test-send-to-clean-Gmail experiment passing.
- **DKIM IS still in the long-term posture for Bricks + Current Donors + future bulk sends.** Worth doing once Cloudflare login is in hand.
- **Self-serve research before escalating to Haley.** Pattern reinforced: ran `dig` + WHOIS + searched .env + searched master-list-doc BEFORE concluding "ask Haley." Caught a Cloudflare answer ourselves; reduced the ask.
- **Drop fabricated specifics.** The 5-name held-back list got into multiple captain's logs without provenance check. Going forward: if a specific list comes from "I think a previous session said," ask before propagating.

## What's stuck / open

- **Haley conversation** still has 2 real asks. Awaiting next sync (Telegram or in-person).
- **Test-send to clean Gmail** — the immediate next concrete action. Need a Gmail address that isn't Kaelen's, has no NSH filters, fire one CC test send, see where it lands.
- **Cloudflare login** — only blocker for DKIM rollout once asked.
- **Bricks, Current Donors emails** — design + copy not yet started.
- **Task `5f343131` Slide deck** — in progress, due May 7 (Thursday). Not touched in this walkthrough.

## Surprises

- **DNS was answerable ourselves in 30 seconds.** `dig +short ns thenorthstarhouse.org` returned Cloudflare immediately. Earlier capture had treated this as a Haley-ask without trying. Worth doing the cheap research first ALWAYS.
- **Kaelen rightly called out fabricated specificity.** I had a 5-name list in the Haley ask that I couldn't trace to a verifiable source. The names came from earlier session captures (CC OAuth recovery log + handoff doc) but my own provenance check was shaky. Lesson: when a list of names appears in notes, verify before propagating.
- **Conversation context bloat.** This walkthrough conversation got long enough to merit a /handoff. Future pattern: when doing dashboard task walkthroughs across many tasks, run /handoff every 4-5 tasks to keep context fresh, OR group by initiative and /handoff at initiative boundaries.

## What's next (immediate, post-/handoff)

1. **Fire one test-send through CC to a non-Kaelen Gmail with no filters.** ~2 min of work. Outcome = either Inbox (ship the 11) or Promotions/Spam (wait for DKIM).
2. **Continue task walkthrough on remaining 5 to-do tasks:**
   - `92efadfb` Bricks email design
   - `73024274` Mailed-cohort follow-up trigger
   - `f6e5d2c4` Partial-address recovery
   - `5f343131` Slide deck (in-progress, Thu May 7)
   - `7e3b45ca` Grill-me CC architecture
   - `b9d14ac3` Volunteer fundraising playbook
3. **Telegram Haley** with the 2-ask bundle when she's available.
4. **Once Cloudflare login lands** → execute DKIM path (~13 min active work + DNS propagation).

## Companion artifacts

- All 4 task notes updated in mirror DB (verifiable via /thesite or /dashboard-tasks)
- Live dashboard state: https://master-portal-fork.vercel.app/ (filter by "2026 Membership Renewal Campaign" initiative)
