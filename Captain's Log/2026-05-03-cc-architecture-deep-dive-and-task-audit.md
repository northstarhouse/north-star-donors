---
type: "captains-log"
date: "2026-05-03"
slug: "cc-architecture-deep-dive-and-task-audit"
status: "complete"
created: "2026-05-03"
---

# Captain's Log — CC Architecture Deep Dive + Dashboard Task Audit

> Did an empirical end-to-end CC flow audit (sender→receiver→reply→analytics), filled the remaining gaps via Perplexity research, wrote the durable architecture knowledge doc, and brought 16 CC-related dashboard tasks current — including renaming the deferred grill-me task to reflect the doc that replaced it.

## Status & purpose

**What got done?**

Continued from the prior leftover-cohort log by filing 3 dashboard tasks: warm-49 ship pipeline (`b12235d3`), cold-75 treatment decision (`9a8102d3`), knowledge-cleanup follow-through (`92bc3430`).

Pivoted to a CC sender + flow audit. Confirmed all 4 senders verified — admin@, wyn@ (BILLING-only), development@, media@ — and noted that development@ + media@ got CONFIRMED via SITE_OWNER pathway on 2026-05-02 without an admin@ inbox click (anyone authenticated as `nshc1905` can self-confirm new senders).

Created `Membership Drive/CC-Audit.md` as a goals-only working doc covering 6 perspectives: sender, receiver, reply, API+analytics, plan-tier+quotas, authentication posture.

Ran 3 empirical send tests via the CC v3 API:
- **Test 1 (dev-to-dev flow):** From: development@, To: development@. Confirmed: From-rewrite to `*-thenorthstarhouse.org@shared1.ccsend.com`, Reply-To preserved as set, landed in Promotions+INBOX, all auth (DKIM/SPF/DMARC) passes but under CC's domain (`shared1.ccsend.com`), not ours.
- **Test 2 (merge tag):** Sent with `[[FIRSTNAME OR "Friend"]]` — rendered as "Hi Development," confirming merge tag works.
- **Test 3 (reply round-trip):** Sent reply from development@ via Gmail API. Reply landed in development@ inbox normally. CC analytics showed ZERO event for the reply.

Tried programmatic click verification via curl — registered 0 clicks despite browser User-Agent + 302 redirect succeeding. That triggered the Perplexity research.

Ran `/perplexity-research` on 5 questions the empirical tests couldn't answer:
- Per-recipient tracking endpoints — corrected to `/v3/reports/email_reports/{activity_id}/tracking/{opens|clicks|bounces|forwards|optouts}` (NOT "unsubscribes" — CC vocab gotcha)
- Open tracking mechanism — `[[TrackingImage]]` template tag REQUIRED in custom HTML or opens silently report 0 forever
- Bot click filtering — auto-enabled for all 2026 accounts; detects timing/IP/TLS fingerprints regardless of UA spoofing
- DKIM effect size — for our scale, marginal; per-recipient engagement history dominates Gmail placement
- Pricing/quota — multiplier model (10×/12×/24× contact tier), nonprofit discount 20%/30% prepay (Standard+Premium only), TechSoup gives 50% off

Created `knowledge/constant-contact-architecture.md` — the durable campaign-agnostic CC reference doc consolidating empirical findings + Perplexity research. Companion to existing `constant-contact-oauth.md`.

Audited 16 CC-related dashboard tasks. Identified 6 active tasks needing forward-looking rewrites: 64e52fd4 Send-to-11, 775e459e DKIM-rollout, 5a93ccbd Derive-Current-Donors, 92efadfb Bricks, 73024274 Mailed-cohort-followup, 7c71f88d Edge-Function. Rewrote all 6 with current-state-and-next-steps only (no journal trail).

Renamed and bumped task `7e3b45ca` from "Grill-me session on CC automation architecture" (`todo`, notes: "Future deeper-dive.") to "CC architecture + ops reference doc" (`in_progress`, notes pointing at the new knowledge file). Decided architecture grill-me wasn't needed — the new doc covers it.

Forked autonomous knowledge-cleanup work in parallel — Haiku audit identified 9 stale vault files (most urgent: fabricated 5-name held-back-Lapsed list in `knowledge/complete-address-rule.md` line 21). Fork running to fix 8 files (1 skipped per memory rule on office-hours-agenda).

**Why was it done?**

Two threads converged. First: needed to actually understand what CC could do empirically before pitching a campaign architecture to the dev committee — couldn't keep extrapolating from docs and assumptions. Second: dashboard tasks had stale framing (e.g., "20-40% deliverability hit without DKIM") that came from generic ESP advice, not measured at our scale, and were anchoring decisions wrong. Both pointed at the same fix: do real tests + real research, then bring the dashboard current.

**What was it supposed to accomplish?**

Three things: (1) durable CC reference doc that future-Kaelen + future-Claude can grab without re-running this work; (2) dashboard tasks that reflect what we actually know now, not what we guessed two weeks ago; (3) decision: do we run a grill-me on CC architecture or have we got enough? (Answer: enough.)

**What goals does it connect to?**

Membership Renewal initiative (`fb7c750f-dc6a-4f9a-a86f-3d6f15c87f4c`) on the mirror dashboard. The architecture doc + dashboard cleanup unblock the warm-49 send pipeline and the dev committee proposal that's still owed.

## Scope & next moves

**What's still left to do on the whole?**

- Cold-75 treatment decision (separate "we miss you" copy vs fold into lapsed cohort vs hold) — task `9a8102d3`
- /cowrite the warm-49 copy (thank-you + upcoming-things) — part of `b12235d3`
- Verify `[[TrackingImage]]` is in the existing `Renewal_Letter` HTML before any production send — flagged in CC-Audit open questions
- Test-send-to-clean-Gmail experiment that's been pending since the 2026-05-03 walkthrough log
- Bricks email design (~25 recipients, separate copy) — task `92efadfb`
- Mailed-cohort follow-up trigger decision — task `73024274`
- Slide deck for dev committee — task `5f343131` in_progress, due 2026-05-07
- Knowledge-cleanup fork output to review when it returns

**Immediate next steps**
- Wait for parallel knowledge-cleanup fork to complete — it's running now; review the 8 file edits before next session — Kaelen + Claude — within this session if it lands soon
- Decide cold-75 treatment — Kaelen — before any cold-tier send
- /cowrite warm-49 copy — Kaelen + Claude — anytime, not blocking on Haley
- Test-send to clean Gmail — Kaelen — gates both the 11-send and the warm-49 send

**Deadlines**
- Slide deck due 2026-05-07
- Otherwise no hard dates on this work

**Owners**
Kaelen on copy, decisions, and Haley sync. Claude on architecture doc maintenance and dashboard ops.

## Resource & capacity

**What did this cost?**

One long focused session. Two forked sub-agents (Perplexity research and the parallel knowledge-cleanup work). ~3 CC API test sends (single-contact each, well under the 10K/day rate limit and any monthly quota concern). Token refresh burned + repaired (auth-server URL gotcha re-discovered).

**Who else got pulled in?**

Nobody human. Pure Kaelen + Claude work with sub-agent assistance.

**What did NOT get done because we did this?**

- Slide deck didn't progress
- Cold-75 treatment decision still open
- Warm-49 copy not written
- Test-send-to-clean-Gmail experiment still pending
- Cloudflare login still missing (Haley dependency for DKIM)

## Risk & dependency

**What could go wrong now that this is in motion?**

- The renewal-letter HTML may be missing `[[TrackingImage]]` — if so, every send so far has had silent 0% open tracking and we wouldn't know. Verify before any production send.
- Token refresh path is fragile — burned the refresh token earlier in the session by hitting the wrong auth-server URL (`authz.constantcontact.com` instead of the correct Okta URL `identity.constantcontact.com/oauth2/aus1lm3ry9mF7x2Ja0h8`). Fixed in `/tmp/cc-oauth/refresh.py` but worth baking into the Edge Function spec when we get there.
- Sender-confirmation governance: anyone with `nshc1905` login can self-confirm new senders without admin@ approval. Low risk in current state but worth knowing.

**What are we waiting on someone else for?**

Knowledge-cleanup fork to return (parallel autonomous run, not human). Otherwise nothing external blocking THIS work — Cloudflare login + Haley pre-send review block downstream work.

**What assumption are we making that we can't yet verify?**

- That `Renewal_Letter.pdf`-derived HTML contains `[[TrackingImage]]` (need to grep)
- That clicks from real Gmail/Outlook clients will register normally (we only verified that curl-based clicks DON'T register; the inverse is assumed)
- That the per-recipient tracking endpoints will return non-empty results when there's actual recipient activity (we got `rows: 0` in our dev-to-dev tests, which is consistent with no real opens/clicks but doesn't prove the endpoints will populate correctly at scale)

## Decisions, stakeholders, learning

**Who needs to know this happened?**

- Future-Kaelen + future-Claude (via this log + the new knowledge file)
- Haley — at minimum, the headline that we now have a clear picture of CC's mechanics and analytics capabilities for the dev committee proposal
- Dev committee — when the slide deck goes out, the architecture knowledge will inform the analytics + deliverability sections

**Has the right person been thanked or asked?**

Not relevant — no human contact this session.

**What did we decide, and why? What did we explicitly choose NOT to do?**

- **CC-Audit.md = working findings doc; promotes to knowledge/ if/when authoritative.** Two-tier pattern: live findings document accumulates evidence, durable knowledge doc gets the synthesis.
- **knowledge/constant-contact-architecture.md = the durable architecture reference now.** Companion to OAuth doc, not replacement. Built campaign-agnostic so it survives any specific campaign's drift.
- **Skip the architecture grill-me.** The new doc covers what a grill-me would have produced for the primitives layer. Open architecture layers (orchestration, behavioral triggers, dashboard data model, reply ingestion, cohort lifecycle) deferred — not blocking the current campaign.
- **Forward-looking task notes only on the dashboard rewrites.** No breadcrumb journal trail in task notes — that's what captain's logs are for. Tasks should read as "current state + next steps," not "history of how we got here."
- **Skip a backfill captain's log on the 2026-05-02 sender verification work.** It's referenced sufficiently in existing logs + the new architecture knowledge file. No need for a dedicated backfill.
- **`unsubscribes` vs `optouts` API path:** going with CC's vocab (`optouts`) everywhere since that's what works.

**What surprised us?**

- The `[[TrackingImage]]` requirement is genuinely invisible to anyone reading the CC v3 docs in passing — likely the #1 silent failure mode for API-sent campaigns. Easy to ship months of campaigns and have zero open data without realizing.
- CC bot filtering is more aggressive than expected — bare HTTP clicks suppressed regardless of User-Agent. Would have wasted hours trying to "test" click-tracking via curl if Perplexity hadn't surfaced this.
- DKIM effect size is much smaller than the "20-40% deliverability hit" the dashboard tasks were citing. Those numbers came from generic ESP advice, not measured at our scale. The actual research (90-day cohort study across 42 mid-market senders) shows +2.4 to +5.1pp at large scale — and per-recipient engagement history dominates at our scale anyway.
- Sender confirmation via SITE_OWNER pathway is a governance finding — anyone with `nshc1905` login can add and self-confirm new senders. Worth flagging.
- Replies are wholly invisible to CC analytics. We'd need to track reply engagement Gmail-side via thread-id matching if we want it as a metric.
- The auth-server URL gotcha bit again. The captain's log from 2026-05-02 (`unreachable-donor-email-recovery-cc-oauth.md`) had it right — `identity.constantcontact.com/oauth2/aus1lm3ry9mF7x2Ja0h8/v1/token` — but I tried the wrong URLs first this session and burned a refresh token before fixing. Bake this URL into any future automation as a constant.

## 🔍 Threads we noticed

- Multi-touch orchestration patterns deferred — manual single-touch is the current campaign mode
- Reply ingestion architecture deferred — Gmail-side, since CC has zero visibility
- CC built-in automations completely untouched (welcome series, behavioral triggers) — alternative to custom Edge Function path
- Cohort lifecycle management still ad-hoc — re-derive from CSVs each campaign
- TechSoup migration question (50% off vs current plan) flagged in CC-Audit open questions — also: what plan tier is NSH currently on?
- Renewal-letter HTML needs `[[TrackingImage]]` verification before any production send
- Bot Clicks dashboard section — if filtered bot clicks land in a separate tab in CC's UI, can we access it via API?

## Companion artifacts

- `knowledge/constant-contact-architecture.md` (NEW — durable architecture reference)
- `Membership Drive/CC-Audit.md` (NEW — working findings doc)
- `/tmp/knowledge-cleanup-audit.md` (Haiku audit output, being acted on by parallel fork)
- Companion captain's logs: `2026-05-02-unreachable-donor-email-recovery-cc-oauth.md`, `2026-05-02-cc-campaign-readiness-and-system-gaps.md`, `2026-05-03-membership-renewal-task-walkthrough.md`, `2026-05-03-email-only-leftover-cohort-segmented.md`
