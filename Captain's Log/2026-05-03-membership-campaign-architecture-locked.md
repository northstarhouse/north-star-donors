---
type: "captains-log"
date: "2026-05-03"
slug: "membership-campaign-architecture-locked"
status: "complete"
created: "2026-05-03"
---

# Captain's Log — Membership Campaign Architecture Locked

> Locked the campaign architecture for ~243 donors across three audiences. Three cohort design briefs, a cross-cohort architecture map, Touch 1 copy drafts post-/rewrite, two visual deliverables (HTML plan + slide deck), TrackingImage casing test passed, and the late-session discovery that NSH's CC Core plan won't run multi-step automation paths natively — pivoted to scoping a hand-orchestration alternative.

## Status & purpose

**What got done?**
Locked the membership campaign architecture. Three cohort design briefs written via /shape grills (warm-86 stewardship sequence, true-cold-38 re-engagement, bricks-30 membership invite). Built a cross-cohort architecture map with mermaid topology and touch-state matrix. Drafted Touch 1 copy for all three cohorts post-/rewrite. Ran a live TrackingImage casing test through CC API and confirmed open-tracking works with lowercase tag. Delivered two artifacts (campaign-plan.html with embedded drafts + ckm-slides deck). Confirmed NSH is on CC Core plan ($43.40/mo) which doesn't support multi-step automation paths — pivoted to scoping a hand-orchestration alternative. 5 campaign-related commits landed (08e9067, cdd3e02, 1129758, 6ce83cb, 672876c) plus 16 from a parallel cleanup agent.

**Why was it done?**
The prior sessions surfaced a list of cohorts and copy directions but no actual campaign *shape* — no sequencing, timing, branching, or measurement plan. The membership renewal initiative needed to move from "we have lists" to "we have a campaign that runs" before Touch 1 could fire. Also: needed to verify CC could execute what we were designing instead of designing-on-faith.

**What was it supposed to accomplish?**
Produce a defensible 3-month campaign plan for ~243 reachable donors across three audiences, with: (a) cohort-specific copy per audience, (b) shared scoreboard methodology (open + click rates, with conversion as the bricks-specific metric), (c) clear measurement infrastructure, (d) plain-spoken Nevada County voice throughout, and (e) deliverables that could be handed to Haley and the dev committee for review.

**What goals does it connect to?**
Membership Renewal initiative on the dashboard (`fb7c750f-dc6a-4f9a-a86f-3d6f15c87f4c`). Indirectly to Q2 fund-development goals — converting the lapse rate into renewal rate and building the email channel as a stewardship surface NSH can run going forward.

## Scope & next moves

**What's still left to do on the whole?**
- **Touch 1 lock-in for warm-86 + true-cold-38 + bricks-30** — verify drafts closely mimic the Renewal_Letter PDF in structure, cadence, voice. Build a side-by-side diff HTML so it's eyeball-able. (Long-lapsed-11 already has its Touch 1: the existing HTML file used for the first test send. That one's done.)
- Upload the 3 list CSVs into the master portal Supabase + surface them on the donor-app site in a progressively-disclosed folder (drop-down arrow) so all Membership Drive lists live together cleanly
- Hand the Touch 1 drafts + lists to Haley for pre-review
- Touch 2-5 copy for warm pool — ongoing, not urgent (NOT cowriting Touch 2 with Kaelen)
- Touch 2 copy for bricks — same
- Slide deck / HTML deliverable — host on here.now, link in the dashboard task, treat as in-progress task with subtasks
- Reply-triage table on master portal — schema migration, try mirror first
- Gmail reply-scrape job — future task, depends on sender choice + schema migration landing first
- Plan-tier consideration (CC Core vs Standard) — open question, not committing yet, surfaces because Kaelen won't be around forever to hand-orchestrate

**Immediate next steps**
- Verify Touch 1 drafts closely mimic Renewal_Letter PDF voice/cadence — Kaelen — by Thursday dev meeting
- Build diff HTML showing Renewal_Letter PDF vs each Touch 1 draft side-by-side — Kaelen — by Thursday
- Fire warm-86 Touch 1 — Kaelen — by Thursday's dev committee meeting
- Upload lists to master portal Supabase + surface on donor-app under a progressive-disclosure folder — Kaelen — before Haley sees them
- Roll up the Haley check-in items into a single dashboard task (existing task probably, just augment) — Kaelen
- Schema migration for `campaign_replies` on master-portal mirror first — Kaelen, then Haley approves before promoting to live
- Slide deck dashboard task — augment with HTML deck path + here.now hosting plan, mark in_progress

**Deadlines**
- **Warm-86 Touch 1 send: Thursday's dev committee meeting** (the real deadline)
- Slide deck for dev committee — same Thursday window (existing dashboard task `5f343131`)
- No other hard dates

**Owners**
- Kaelen on copy verification, drafts, sends, orchestration, all CC + master-portal infrastructure, slide deck
- Haley on cohort pre-review, sender choice, CTA URL confirmation, schema migration approval (after mirror tested)
- Wyn potentially looped in on plan-tier decision later (not now)
- Dev committee = Thursday audience

## Resource & capacity

**What did this cost?**
~5-6 hours of focused conversation + tool use. Sub-agent calls: parallel cleanup agent (16 commits), Perplexity research on CC Automations. CC API calls: token refresh, dozens of test sends + tracking pulls, contact list management. Master-portal Supabase queries: list discovery, member-table search, fuzzy-match work. Token economics: heavy session, multiple long context windows. No money cost. One real CC test campaign sent + tracked.

**Who else got pulled in?**
Nobody human in real-time. Sub-agents: Perplexity for CC Automations research, parallel cleanup agent for 16 commits. /rewrite for the 3 Touch 1 drafts, /captainslog (this one), /ckm-slides for the deck, /impeccable for the campaign-plan.html. No Haley or Wyn involvement this session.

**What did NOT get done because we did this?**
- Slide deck for dev committee (still in_progress, due Thursday — adjacent task touched but not finished)
- Touch 2-5 copy drafts for warm pool
- Touch 2 copy for bricks
- The actual Touch 1 production send (designed, drafted, but not fired yet)
- Gmail reply-scrape script
- Master portal `campaign_replies` schema migration
- List uploads to master portal + donor-app site folder
- The Renewal_Letter-mimic-fidelity diff HTML (the new "must do before Thursday" thing)

## Risk & dependency

**What could go wrong now that this is in motion?**
- **Touch 1 fires before Haley reviews lists** → bad sends to deceased / staff / awkward-overlap recipients. Mitigated by hand-Haley-the-lists step before Thursday.
- **Drafts drift too far from Renewal_Letter voice** → recipients pattern-match to "different campaign" and tone breaks. Mitigated by the new "verify mimic fidelity" step + diff HTML.
- **CC plan tier becomes a hard wall** if we try to set up automation paths in CC's UI before realizing Core can't host them. Already discovered this session; pivoted to hand-orchestration plan, but the long-term sustainability question is real (Kaelen won't always be around).
- **Master portal schema migration breaks the mirror or live** if not staged correctly. Mitigated by mirror-first approach.
- **Sender choice never gets resolved** → defaults to dev@ which is fine for testing but may not be the long-term canonical "voice of the house." Affects per-recipient Gmail engagement history; switching mid-campaign resets it.
- **Reply-triage table doesn't ship before Touch 1** → replies land in someone's inbox unstructured. Recoverable (structured logging can backfill later), but the SLA degrades if there's no system catching them.

**What are we waiting on someone else for?**
- **Haley** — sender choice, CTA URL confirmation, list pre-review, schema migration approval
- **Wyn / Haley jointly** — eventual plan-tier upgrade decision (not blocking now)
- Nothing else external

**What assumption are we making that we can't yet verify?**
- That `/donate` is the right CTA URL (Haley may know about a Wix form / membership page we haven't found)
- That the Touch 1 drafts mimic the Renewal_Letter PDF closely enough — needs eyeball verification + the diff HTML
- That hand-orchestration on CC Core actually works at the scale we'd need (proven for single sends, untested for the full 4-5 touch sequence with branching)
- That the master portal `campaign_replies` table won't conflict with anything Haley has planned
- That the engagement-rate scoreboard reads as "the campaign worked" to the dev committee — they may want conversions instead

## Decisions, stakeholders, learning

**Who needs to know this happened?**
- Future-Kaelen + future-Claude (via this log + the architecture map)
- Haley — Thursday dev meeting if not before, the campaign architecture is now defensible
- Dev committee — Thursday meeting via the slide deck
- Eventually: whoever takes over donor stewardship after Kaelen — the architecture doc + briefs are the handoff artifact

**Has the right person been thanked or asked?**
No external person contacted this session. The Haley async questions are queued, not sent.

**What did we decide, and why? What did we explicitly choose NOT to do?**
- **One campaign architecture, three cohort-specific sequences.** Not three separate campaigns.
- **Cold-75 split at 2023.** 37 fold into Warm Pool, 38 stay as standalone signal-extraction touch.
- **Generic "we've been in touch" framing for Touch 2 onward** instead of per-entry-path versioning. Operational simplicity wins for a 2-person ops team.
- **Open + click rate is the scoreboard for Warm Pool + True Cold.** Membership conversion is the scoreboard for Bricks specifically.
- **Plain-spoken Nevada County voice** non-negotiable across all drafts. No marketing register.
- **Membership-status-agnostic language** because we don't have a member roster anywhere we can query.
- **/donate as the working CTA URL** until Haley confirms a better path.
- **Hand-orchestration on CC Core** is the working plan, not waiting on a Standard upgrade.
- **Mirror-first for the schema migration** before live.
- **NOT cowriting Touch 2-5 yet.** Touch 1 lock-in is the focus.
- **NOT doing additional test sends** — one was enough.
- **NOT spinning up the Gmail reply-scrape job yet** — depends on sender choice + schema migration.
- **CKM slides deck + impeccable campaign-plan.html are DRAFTS, not verified.** Useful as references for tweaking and showing the shape of the plan, but not canonical artifacts. Should be clearly labeled as drafts before any external sharing.

**What surprised us? What was harder than expected?**
- **NSH is on CC Core.** Found it 6 hours into the session by clicking "Upgrade now" in the dashboard. Should have verified plan tier on day 1 of CC architecture work — would have saved time spent designing automation paths the platform can't run natively.
- **`Membership Mailer List 2026` has 109 names but ZERO emails attached** in the master portal donors table. Donors table has no email field populated; emails live entirely in CC. Means the only way to know "is this person a member" is to ask Haley directly.
- **CC's parser is case-insensitive on `[[trackingImage]]`.** Saved a probable rebuild of every existing template if it had been case-sensitive.
- **The pivot from "design the campaign" to "verify CC can run it"** came too late in the session. Plan-tier verification should be a day-zero check before any campaign architecture work.

## 🔍 Threads we noticed

- The `_starhouse/`, `_master-portal/`, `_raw/`, `_treatment/` quarantine folders were skipped by the cleanup agent — may need a gitignore decision
- Cleanup agent suggested gitignore additions: `.browser-profile/`, `.claude/scheduled_tasks.lock`, `.claude/skills_quarantine/`, `*.bak.*`
- Salesforce CSVs (`sf-2024-memberships.csv`, etc) have no email columns — the Salesforce export setup is missing the email field, worth flagging for whoever maintains it
- NSH's actual member roster doesn't exist as a queryable artifact anywhere we can access — worth surfacing to Haley as a separate architecture question outside this campaign
