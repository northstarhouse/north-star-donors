---
type: "captains-log"
date: "2026-05-05"
slug: "master-portal-fund-development-triage"
status: "complete"
created: "2026-05-05"
---

# Captain's Log - Master Portal Fund Development Triage

> After staging the Membership Email Campaign, we cleaned up Haley's Master Portal task board, ported one Mirror task, and scoped the next Grill With Docs session around sponsorships, grants, volunteers, and the rest of the Fund Development Plan.

## Status & Purpose

**What got done?**
We moved from campaign buildout into task triage. The goal was to decide which pieces from the Membership overview and Kaelen's Mirror board actually belong on Haley's live Master Portal board.

Added to Haley's Master Portal:

- `Define reply monitoring plan for membership emails` — Membership Email Campaign, `Decision`, `todo`.
- `Send Long-Lapsed Email-Only Renewal to 11 recipients` — Recently Lapsed Member Letter, `Stakeholder Outreach`, `in_progress`.

Updated existing Haley tasks:

- `Set up membership mail merge` — moved to `done`.
- `Edit/Proof Read Recently Lapsed Members Letter` — moved to `done`.

**Why was it done?**
Kaelen wanted the board to reflect real next actions without turning every implied campaign step into a task. We filtered out noise like send-order confirmation and scheduling tasks because those are either vetoed or implied by the approval flow.

## Current Board State

Membership tasks now include:

- `Confirm Constant Contact sender address` — Membership Email Campaign, `Decision`, `todo`.
- `Confirm membership email audience groups` — Membership Email Campaign, `Decision`, `todo`.
- `Review Touch 1 email drafts` — Membership Email Campaign, `Editing`, `todo`.
- `Build Touch 1 draft campaigns in Constant Contact` — Membership Email Campaign, `Technical`, `done`.
- `Define reply monitoring plan for membership emails` — Membership Email Campaign, `Decision`, `todo`.
- `Set up membership mail merge` — Recently Lapsed Member Letter, `Technical`, `done`.
- `Edit/Proof Read Recently Lapsed Members Letter` — Recently Lapsed Member Letter, `Editing`, `done`.
- `Send Long-Lapsed Email-Only Renewal to 11 recipients` — Recently Lapsed Member Letter, `Stakeholder Outreach`, `in_progress`.

The new long-lapsed task carries rich notes from Mirror and Captain's Log context:

- recipient list: `Membership Drive/lists-csv/long-lapsed-undeliverable-email-recovered-2026-05-02.csv`;
- HTML: `Membership Drive/email-drafts-2026-05-02/Long-Lapsed-Email-Only-Renewal.html`;
- logic: this is Touch 1 for 11 long-lapsed donors who could not receive the physical letter but had emails recovered through Constant Contact;
- gate: spot-check name matches, confirm sender/reply address, and get Haley comfortable before sending;
- caveat: DKIM is not treated as a blocker for this small 11-person send.

## Decisions

**What did we decide to add?**
Only the reply-monitoring decision and the 11-recipient long-lapsed renewal task were added. These represent real work that was not already covered by existing tasks.

**What did we decide not to add?**

- No `Confirm Touch 1 send order` task. Kaelen vetoed this as unnecessary.
- No `Schedule Warm Touch 1 after approval` task. Scheduling is implied after approval gates clear.
- No Touch 2, Touch 3, tracking, or reply-table buildout tasks yet.
- No direct port of broad Mirror tasks without re-scoping them for Haley's current app.

**How are we treating replies?**
Constant Contact tracks sends, opens, clicks, bounces, and unsubscribes. Human replies go to the reply-to inbox. Therefore reply monitoring is an operational decision: who checks the inbox, how often, what gets escalated, what gets logged, and which replies should suppress later touches.

## Fund Development Fronts

We started a first-pass argument for how to proceed beyond Membership.

**Membership**
Operational now. Keep moving through review gates rather than adding more architecture.

**Sponsorships**
Mature enough to surface next, but not as execution-ready as Membership. Existing artifacts include:

- `knowledge/nsh-sponsorship-program.md`;
- `knowledge/nsh-sponsorship-packet-v1.md`;
- `_drafts/2026-04-26-sponsorship-packet-v1.md`;
- `_drafts/assets/sponsorship-packet-v1.pdf`;
- `_drafts/2026-04-30-sponsorship-deck`;
- sponsor data under `data/google-sheets/nsh-2025-sponsors.csv` and `data/google-sheets/nsh-2026-sponsors.csv`.

Working argument: create a Sponsorships initiative around packet review / sponsor outreach, not a new system.

**Grants**
Real, but belongs in its own Grants Pipeline lane. Existing artifacts include:

- `knowledge/nsh-grant-profile.md`;
- `knowledge/grant-pipeline.md`;
- `knowledge/her-grant.md`;
- `strategy/initiatives/grants-pipeline.md`;
- `strategy/nsh-grant-criteria.md`;
- `queries/out/grants-due.md`;
- `data/candid-grantmakers-historic-preservation-ca-2026-04-08.csv`.

Working argument: first task should be grant pipeline review and deadlines, not "apply for grants."

**Volunteers**
Volunteers are support capacity and proof of organizational strength, not necessarily their own Fund Development lane yet. The Mirror candidate was `Build volunteer-facing fundraising playbook`.

Working argument: define whether this belongs under Infrastructure / Systems, Donors, or a volunteer activation initiative before adding it.

**Earned Revenue**
No strong current artifact trail found in this pass. Leave parked.

## Next Session

Run `grill-with-docs` on the other Fund Development Plan fronts.

Target question:

How should Haley's Master Portal represent Sponsorships, Grants, Volunteers, Donors, Infrastructure / Systems, and Earned Revenue without overbuilding or dumping half-baked Mirror work onto her board?

Prep for Grill With Docs:

- read `AGENTS.md`;
- read `CONTEXT-MAP.md`;
- check relevant domain context if present;
- inspect sponsorship, grant, and volunteer artifacts listed above;
- compare against the current Master Portal task/initiative model;
- ask one question at a time.

Likely first concrete decisions:

- whether `Sponsorship Packet / Sponsor Outreach` should become an initiative under `Sponsorships`;
- whether `Grants Pipeline` should become an initiative under `Grants`;
- whether volunteer fundraising support is a task, an initiative, or a note inside sponsorship/donor work;
- whether any protected overview pages are needed yet, or whether dashboard tasks are enough.

## Threads We Noticed

- Kaelen wants clean queues: no stale PRs, no stale Mirror tasks, no vague "what is this?" board clutter.
- The working pattern is succeeding: add only the minimum structure needed for the next real discussion.
- Next Grill With Docs should push back on category inflation: just because Fund Development has six slots does not mean each slot needs an initiative today.
