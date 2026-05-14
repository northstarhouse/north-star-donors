---
type: "captains-log"
date: "2026-04-30"
slug: "donor-drive-day-one-reactivation-schematic"
status: "complete"
created: "2026-04-30"
---

# Captain's Log — Donor Drive Day One: Reactivation Schematic

> Day-one of the donor drive: small-batch physical letter run today, plus designed a research-grounded email-only multi-touch reactivation campaign Kaelen will pitch via slide deck → invite pushback → ratify → execute via Constant Contact.

## Status & purpose

**What got done?**
- Mailed 16 long-lapsed donor letters + matching Avery 8460 labels at the post office.
- Mailed the vast majority of the 53 lapsed-donor batch (handful held by Haley for address fixes / personalization tweaks — TBD).
- Pulled the "Brick Purchases Only — Not Members" list (34 names) from Master Portal to `/Users/ender/vault/Membership Drive/lists-csv/Brick-Purchases-Not-Members-2026-04-30.csv`.
- Ran email-enrichment sweep across all 59 Mirror tables for the 79 unreachable donors (45 long-lapsed + 34 bricks). Only 3 matches found, all in `2026 Volunteers`. **Conclusion (unverified):** The Mirror likely doesn't have email coverage for these cohorts. The real source is *probably* Constant Contact's existing contacts, but that's a hypothesis until we actually pull CC's contact list and check.
- Augmented the donor-reactivation playbook (now at `/Users/ender/vault/Membership Drive/research-and-strategy/research-donor-reactivation-playbook-2026-04-02.md`) with email-only research: 5-touch May–July cadence, open/click benchmarks, subject-line patterns, Constant Contact features, deliverability warm-up procedure, 3-vs-5-touch tradeoff.

**Why was it done?**
NSH has a real lapse problem on a 100–500 donor universe; campaign converts lapsed donors back to members. Wyn flagged that physical mail at scale is cost-prohibitive, so today's print run was deliberately small-batch (high-value tier only). Email is the workhorse going forward.

**What was it supposed to accomplish?**
Two goals layered:
- (a) Get physical letters into the hands of high-value lapsed donors today (16 long-lapsed + bulk of 53 lapsed = ~69 mailed).
- (b) Design a research-grounded email-only multi-touch reactivation campaign Kaelen can pitch via slide deck → invite pushback → ratify, then execute via Constant Contact as a CC apprenticeship.

**What goals does it connect to?**
No explicit mapping made yet. Open thread: Haley's Master Portal has a `strategic_goals` table; mapping this campaign's progress to specific rows in that table would create real visible progress for Kaelen and Haley to see in the DonorApp UI — clear goals, clear strategies, actual logged progress, clear next steps. Need to inspect the table's shape to know what's possible.

## Scope & next moves

**What's still left to do on the whole?**
- Build a slide deck pitching the cadence design + research grounding + CC apprenticeship framing.
- Post the deck to the DonorApp site so Haley and other stakeholders can see it and push back.
- Have a follow-up `/grill-me` session on Constant Contact automation architecture (open questions captured separately, see *Threads we noticed* below).
- Verify the unverified hypothesis: pull Constant Contact's existing contact list and fuzzy-match against the 79 unreachable donors. If CC has emails for many of them, our deliverability story changes.
- Check in with Haley on the lapsed-batch tail (the few she was holding for tweaks/address fixes).
- Build a volunteer-facing fundraising playbook — phone-call reactivation is one specific use case, but the broader question is how to activate the multiple volunteers who've expressed interest in fundraising. Big to-do, separate workstream.

**Immediate next steps**
- Build the slide deck — Kaelen — by Monday 2026-05-04
- Investigate how to post the deck to the DonorApp site (here.now URL? Haley's Supabase-hosted-PDF approach? other format?) — Kaelen — by Monday 2026-05-04
- Interrogate Constant Contact (verify APIs, pull existing contacts, understand what's already configured) — Kaelen — by Monday 2026-05-04
- Check in with Haley on the lapsed-batch tail — Kaelen → Haley — by Monday 2026-05-04

**Deadlines**
All four immediate next steps: Monday 2026-05-04. Open question on how to actually hold to deadlines (see Threads we noticed).

**Owners**
Kaelen on all of the above. Haley is recipient on the lapsed-batch check-in and the slide-deck pushback round.

## Resource & capacity

**What did this cost?**
Hours: full day of donor-drive work (mail merge pipeline, label printing, post office run) plus a meaty evening of strategy / research / CC investigation / skill patching. Money: minimal — postage on ~69 letters, label/letter paper, no software costs. Attention: substantial — donor drive was the dominant focus today.

**Who else got pulled in?**
Haley held back a small handful of lapsed-list addresses for personalization tweaks. Wyn's prior cost guidance ("don't do physical mail at scale") shaped today's decision to stay small-batch, even though she wasn't pulled in directly.

**What did NOT get done because we did this?**
*Not captured.*

## Risk & dependency

**What could go wrong now that this is in motion?**
- The **unverified email-source hypothesis** — we're betting Constant Contact has the emails for the 79 unreachable donors. If it doesn't, the entire reactivation campaign loses its target audience and we're back to address discovery.
- The **slide deck doesn't get pushback** — if Haley and stakeholders rubber-stamp the cadence without actually engaging, we ship something untested in the real-world political/relational sense, not just the technical one.
- The **Monday deadline slips** — no system in place for personal accountability. Campaign loses momentum if next-steps drift past Monday.

**What are we waiting on someone else for?**
- Haley: confirmation on the lapsed-batch tail (did the held-back letters get sent?).
- Stakeholder pushback on the slide deck once posted.

**What assumption are we making that we can't yet verify?**
- **Constant Contact has email coverage for the 79 unreachable donors.** Hypothesis only. Verification = pulling CC's existing contact list and fuzzy-matching.
- **The 5-touch May–July compressed cadence is the right shape for NSH specifically.** Research-grounded but not stakeholder-validated; that's the whole point of the slide deck pushback round.
- **Posting a deck to the DonorApp site is the right channel for inviting pushback.** Haley posted a PDF that way; we're assuming our format will work similarly, but haven't investigated.

## Decisions, stakeholders, learning

**Who needs to know this happened?**
- **Haley** — needs to know about the slide deck coming + lapsed-batch tail check-in.
- **Development committee** — primary audience for the slide-deck pushback round on the DonorApp site.
- **Board** — could see the deck if they wanted; not the primary audience.
- **Volunteers interested in fundraising** — eventually, when the volunteer playbook is ready. Not yet.

**Has the right person been thanked or asked?**
*No action taken.*

**What did we decide, and why? What did we explicitly choose NOT to do?**

Decisions made today:
- **Channel mix:** email = default workhorse for outreach. Physical mail = small-batch, high-value-only by design. Reason: Wyn's cost-prohibitive flag + today's printer pain validated it.
- **Phone calls = volunteer territory.** Kaelen has no capacity for phone outreach. Phone calls have the best ROI per the research (15-25% reactivation), so they're a great use of the multiple volunteers expressing interest in fundraising — once we have a system to activate them.
- **CC apprenticeship strategy:** start human-driven in CC browser for the next campaign, log API automation as parallel infrastructure work. Don't gate the campaign on tooling.
- **Cadence (tentative, pending pushback):** 5-touch May–July compressed reactivation series, then May–November = normal comms only to those who engaged. Optional fall touch for openers-who-didn't-give. Research-grounded but not stakeholder-validated.
- **Slide deck pitch + development-committee pushback** is the ratification mechanism — making the deck forces deeper thinking; posting it to the DonorApp invites real-world critique before execution.
- **Bricks-list channel:** email-first, not mail. Address discovery for the 34 brick-buyers-not-members is lower priority than email enrichment, but not ruled out — partial address info (street name + Grass Valley / Nevada City context) could be enough to fill gaps.

## 🔍 Threads we noticed

- **Strategic Goals mapping** — inspect Master Portal `strategic_goals` table; map this campaign's progress to specific rows so Kaelen and Haley see visible goal-tied progress in DonorApp UI.
- **Volunteer activation broadly** — multiple volunteers interested in fundraising, no system yet for activating them; phone-call reactivation is one specific use case worth designing for.
- **CC automation architecture** — separate `/grill-me` session needed to design Automation Path, deliverability strategy, etc. Tentative jumping-off-point at `/Users/ender/vault/Membership Drive/research-and-strategy/2026-04-30-cc-tentative-build-brief.md`.
- **Posting decks to DonorApp** — figure out the mechanism (here.now URL? Haley's Supabase-hosted PDF approach? other?); investigate what slide-deck format options exist (HTML, PDF, etc.).
- **CC dashboard component on DonorApp** — surface Constant Contact campaign status (open rates, click rates, sends, reactivations) as a glance-able dashboard widget so Kaelen + Haley can see outreach state at a glance.
- **Personal deadline-management system** — Kaelen doesn't currently have a system for being held accountable to deadlines. Not Notion, not Google Calendar reminders. Possible dashboard feature: tasks + due dates set by Kaelen for himself.
- **Partial-address recovery for unreachable donors** — for donors with street name only (no city/state/zip), if the streets are in Grass Valley / Nevada City we can fill gaps and bring them back into mailable status.
