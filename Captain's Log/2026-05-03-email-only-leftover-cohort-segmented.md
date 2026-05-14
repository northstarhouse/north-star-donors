---
type: "captains-log"
date: "2026-05-03"
slug: "email-only-leftover-cohort-segmented"
status: "complete"
created: "2026-05-03"
---

# Captain's Log — Email-Only Leftover Cohort Segmented

> Derived a 124-name "leftover-donors-email-only" recipient cohort by inverting the question (everyone NOT on the 5 existing campaign lists who has a CC email), then dropping volunteers/staff/insiders, then splitting warm-vs-cold per /the-fool's red-team. Replaces the stale "~99 Current Donors" assumption from the April 5 strategy doc.

## Status & purpose

**What got done?**
Derived a 124-name "leftover-donors-email-only" cohort — donors NSH can email who weren't already on any of the 5 active campaign lists, aren't active volunteers/staff/board, and aren't insider exclusions. Segmented into 49 warm (donated 2024+) and 75 cold (pre-2024) per /the-fool's red-team verdict. Wrote two CSVs into `Membership Drive/lists-csv/` using the established `lowercase-hyphen-yyyy-mm-dd-(pending-haley-review)` naming. Patched 2 dashboard tasks (`5a93ccbd` Derive Current Donors + `775e459e` DKIM rollout) with the new numbers, cohort split, and file paths.

**Why was it done?**
The Membership Renewal initiative had a "Current Donors" task with stale assumptions ("~99 donors" from a frozen 2026-04-05 segmentation CSV that nobody had re-derived). Earlier this session I tried twice to derive the list and got confused because the existing list-CSV cohorts didn't cleanly invert to "everyone else." Kaelen reframed: instead of defining "current donors," invert — pull everyone NOT on existing lists with a CC email. That clicked. Then ran it through /the-fool to find what was wrong with the result before it shipped.

**What was it supposed to accomplish?**
Produce a clean, defensible recipient list for the next round of campaign emails — one that doesn't accidentally re-touch already-targeted donors, doesn't blast volunteers/staff/board, doesn't make false "thank you for being a member" claims to people whose last gift was 4 years ago, and is auditable (each exclusion criterion is named and documented in the task notes + this log).

**What goals does it connect to?**
Membership Renewal initiative (`fb7c750f-dc6a-4f9a-a86f-3d6f15c87f4c`) — specifically the Current Donors branch that had been open since the April 5 strategy. Indirectly: NSH Q2 fund-dev goal of converting lapse rate to renewal rate.

## Scope & next moves

**What's still left to do on the whole?**
- Hand both CSVs to Haley for pre-send review (deceased / awkward / staff-adjacent flags she'd catch but the data wouldn't)
- Decide treatment for the 75 cold tier: separate "we miss you" copy, fold them into the lapsed cohort, or hold
- /cowrite the warm-tier copy (thank-you + upcoming-things, NOT renewal framing)
- Test-send to clean Gmail (same gate as the 11-send, per 2026-05-03 walkthrough log)
- Fire the warm-49 campaign in CC

**Immediate next steps**
- Ship the two CSVs to Haley for pre-send eyeball — Kaelen — next Haley sync
- /cowrite warm-tier copy — Kaelen — anytime, not blocking on Haley
- Cold-tier treatment decision — Kaelen — before any cold-tier send
- Test-send to clean Gmail — Kaelen — before warm-49 fires

**Deadlines**
None hard. Slide deck (separate task `5f343131`) is due 2026-05-07. The leftover-cohort send isn't on a hard date.

**Owners**
Kaelen on derivation, copy, and send. Haley on the pre-send review pass.

## Resource & capacity

**What did this cost?**
~90 minutes of focused conversation + tool calls. Two forked sub-agents (knowledge-cleanup audit on Haiku — separate output, not load-bearing for this work; /the-fool red-team on Sonnet). Several PostgREST queries against mirror Supabase. Multiple Python iterations to get the exclusion logic right. Cheap.

**Who else got pulled in?**
Nobody human. /the-fool red-teamed (sub-agent). Knowledge-cleanup audit ran in parallel (sub-agent, output parked at /tmp/knowledge-cleanup-audit.md, not yet acted on).

**What did NOT get done because we did this?**
- Slide deck (still in_progress, due 2026-05-07)
- Test-send-to-clean-Gmail (the immediate next concrete action from yesterday's walkthrough) — still not done
- Bricks email design (`92efadfb`)
- Mailed-cohort follow-up trigger definition (`73024274`)

## Risk & dependency

**What could go wrong now that this is in motion?**
- **Cold-75 treatment decision lingers.** /the-fool flagged that one-size copy across a 6-year recency span is the central failure point. If we drift and accidentally lump warm + cold into one send, we replicate the exact failure /the-fool warned about.
- **Loose name-matching false positives.** Volunteer-exclusion used last-name + first-initial overlap. Possible (low-probability) we excluded someone unrelated who shared a name with a volunteer. No false-positive review done; the 12 flagged all looked real on eyeball but weren't deeply audited.
- **Haley pre-send review could surface a deeper rebuild.** If she flags 10+ names as "shouldn't get this," the list-derivation logic itself comes into question and we re-run.
- **Mirror-vs-live drift.** Numbers are from the mirror. Live could have donors added/removed since last sync. Refresh on day-of-send.

**What are we waiting on someone else for?**
Haley's pre-send eyeball. Nothing else external.

**What assumption are we making that we can't yet verify?**
- That the volunteers table is complete + reasonably current — anyone informally NSH-involved who isn't in the table (Howard Levine was the live example) sneaks through.
- That CC's contact list email-address-by-name match is reliable — name-string matching has known fuzzy-edge failure modes.
- That "NOT on any of the 5 lists" + "in CC" + "not a volunteer" actually defines a coherent group worth one email. /the-fool said no — the 6-year recency span is too wide. Working assumption now: 49 warm is coherent, 75 cold needs separate treatment.

## Decisions, stakeholders, learning

**Who needs to know this happened?**
- Future-Kaelen + future-Claude (via this log)
- Haley — when she's handed the lists, the methodology context lives here
- Dev committee — eventually, when campaign performance is reported, the cohort definitions matter for interpreting open/click rates

**Has the right person been thanked or asked?**
Not relevant — pure local op, no human contact this session.

**What did we decide, and why? What did we explicitly choose NOT to do?**
- **Invert the question, don't define "current donors."** Trying to positively define "current donor" kept producing fuzzy boundaries (any 2025+ donation? membership tier? something else?). Inverting — pull everyone NOT on existing lists who has email — produced a defensible set with each exclusion auditable.
- **Trust giving data over the frozen segmentation CSV.** April 5 segmentation said 99 / 107 / 232. Live mirror said 97 / 58 / 45. The frozen snapshot drifted from reality; using live data is the right default going forward.
- **Drop fabricated "Top names" assumptions.** The strategy doc named Howard Levine, Mary Anne Dulmage, David Wright, Kenneth Underwood as "Current Donor top names." Live derivation showed Kenneth + David Wright as Board Members (excluded), Howard as a social-context exclusion per Kaelen. Mary Anne stays. Strategy doc is now superseded on this question.
- **Split warm/cold, don't one-size.** Per /the-fool: "thank you for being a member" sent to a 2021-last-gift donor whose spouse died in 2023 = wrong, hurtful, unrecoverable. Warm-49 gets that copy; cold-75 gets different treatment or none.
- **Filename pattern: leftover-donors-email-only-{warm|cold}-{recency-tier}-{date}-(pending-haley-review).csv.** Captures uniqueness (leftover = not on other lists), channel (email-only), tier, date, and incompleteness. Renamed once mid-session when "current-donors-..." failed to differentiate from the existing lists.
- **Drop Holly Mitten + Howard Levine specifically.** Holly via @thenorthstarhouse.org email = staff filter. Howard via Kaelen instruction (social-context concern from captain's log notes about the Peggy Swan Levine connection).
- **Append-only task notes with `[2026-05-03 leftover-list derived]` markers.** Per established convention. Preserves the breadcrumb of how task notes evolved.

**What surprised us?**
- **62 of 97 "current donors" overlapped with existing exclusion lists.** Lists were pulled before recent renewal donations posted, so the lists are stale relative to the giving data. This is a real calibration finding: list cohorts decay quickly when donors keep giving.
- **Donors table has zero email addresses.** All 403 donor rows have NULL email. Emails live entirely in Constant Contact. Silent dependency: any "email a donor" workflow needs a CC fuzzy-match step.
- **Volunteers table holds Board + Staff too** under the "Team" field with values like "Board Member", "Staff | Fundraising", etc. Single-table check covers all three categories. Useful to remember.
- **/the-fool caught Holly Mitten via @thenorthstarhouse.org email** — a single-line domain filter. The volunteers-table exclusion missed her because she's not in the volunteers table. The lesson: filter by domain too, not just by table membership.

## 🔍 Threads we noticed

- **Knowledge-cleanup audit ran in parallel** — output at /tmp/knowledge-cleanup-audit.md identifies 9 stale knowledge files (especially `strategy/2026-membership-campaign.md`, `knowledge/nsh-donor-segmentation.md`, `knowledge/complete-address-rule.md` with fabricated 5-name list). Not acted on yet.
- **Cold-75 treatment is unresolved.** Three options: separate "we miss you" copy, fold into lapsed cohort, or hold. Decide before any cold-tier send.
- **List-decay calibration finding.** 62 of 97 "current donors" overlapped exclusion lists pulled ~3 days earlier — meaning list-CSVs decay fast and re-derivation should be the default for any future send.
- **Volunteers table has staff + board mixed in.** Worth knowing for any future cohort-building. The "Team" field values to filter on: Board Member, Staff (any combination).
- **NSH-domain email filter is a real exclusion criterion.** `@thenorthstarhouse.org` = insider. Should be a default exclusion for any donor-facing email send.
- **Howard Levine social-context exclusion is undocumented in any system.** Lives only in Kaelen's head + this log. If we ever scale donor outreach to other operators, exclusions like this need a real home.
