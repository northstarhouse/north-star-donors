---
type: "captains-log"
date: "2026-05-05"
slug: "master-portal-membership-campaign-buildout"
status: "complete"
created: "2026-05-05"
---

# Captain's Log - Master Portal Membership Campaign Buildout

> Built the Membership Email Campaign into Haley's Master Portal as protected campaign content, structured dashboard work, inspectable cohort lists, and staged Constant Contact draft campaigns. No emails were sent or scheduled.

## Status & Purpose

**What got done?**
Haley's Master Portal moved from "one protected overview exists" to a working Membership Campaign operating surface:

- merged task initiative support, task area chips/filters, and protected email draft pages into `northstarhouse/north-star-donors`;
- linked the Membership Email Campaign to the Fund Development / Membership area;
- uploaded the three cohort lists into the Master Portal Lists page;
- uploaded protected draft pages for Warm, Cold, and Brick Buyers Touch 1;
- staged three Constant Contact draft campaigns with their matching lists attached;
- recorded Constant Contact's sendability mismatch where existing unsubscribes reduce sendable counts.

**Why was it done?**
Kaelen wanted to keep building Haley's site from real needs rather than porting a large Mirror/Cockpit system wholesale. The goal was to add only enough structure to make the Membership campaign reviewable and actionable: area, initiative, task type, task status, protected documents, inspectable lists, and draft campaigns ready for review.

**What goals does it connect to?**
This connects to the 2026 Membership Email Campaign, the broader Fund Development Plan, and the Master Portal strategy of building small, bespoke, protected work surfaces as the campaign requires them.

## Scope & Next Moves

**Repository work merged**

- PR #5: task initiatives.
- PR #6: task area chips and filters.
- PR #7: protected email draft pages.
- Latest relevant merge commit: `886ab5007f011e3596b2865afdc47c34fb8cd61a`.

Recent donor app `master` history now includes:

- `886ab50` Add protected email draft pages.
- `349209e` Show task areas.
- `9391f2b` Add task initiatives (#5).
- `8c630be` Add Decision task label (#4).
- `4840a50` Add protected membership campaign overview.

**Supabase / Master Portal data changed**

Master Portal project: `uvzwhhwzelaelfhfkvdb`.

Protected overview:

- slug: `2026-membership-email`;
- route: `/campaigns/2026-membership-email/`;
- "Next Actions" removed;
- draft reference map links to the protected draft pages;
- new "Constant Contact Sendability" section added.

Protected drafts:

- `2026-membership-email-warm-touch-1`;
- `2026-membership-email-cold-touch-1`;
- `2026-membership-email-brick-buyers-touch-1`.

Lists copied into Master Portal:

- `2026 Membership Email Tier - Warm` - 86 source contacts;
- `2026 Membership Email Tier - Cold` - 38 source contacts;
- `2026 Membership Email Tier - Brick Buyers` - 30 source contacts.

**Dashboard tasks now under Membership Email Campaign**

- `Confirm Constant Contact sender address` - `Decision`, `todo`.
- `Confirm membership email audience groups` - `Decision`, `todo`; notes now include source vs. Constant Contact sendable counts.
- `Review Touch 1 email drafts` - `Editing`, `todo`.
- `Build Touch 1 draft campaigns in Constant Contact` - `Technical`, `done`.

**Immediate next gates**

- Haley or Kaelen reviews the three Touch 1 drafts.
- Sender address / reply handling is explicitly approved.
- Audience groups are approved with the unsubscribe caveat understood.
- Only after those gates should anyone discuss scheduling or sending.

## Constant Contact

**Drafts staged**

All three campaigns were created as Constant Contact draft campaigns. No schedule, send, or test-send endpoint was called.

Warm Touch 1:

- campaign: `e5b5a45f-9120-4096-9e43-94603582c2c0`;
- primary activity: `7933aa9a-6956-4984-8526-fbb15730477e`;
- subject: `A note from the North Star House`;
- attached list: `2026 Membership Email Tier - Warm`.

Cold Touch 1:

- campaign: `06db9219-64a6-4838-8df5-92d5fc94275a`;
- primary activity: `f81de067-34ae-43f9-87e4-4929d88ed8d2`;
- subject: `It's been a while`;
- attached list: `2026 Membership Email Tier - Cold`.

Brick Buyers Touch 1:

- campaign: `7ac045d8-e33f-4e45-81ce-afbfd42ba05d`;
- primary activity: `171ac8ef-f4d5-4298-8598-edd5a66fada3`;
- subject: `Your brick at the North Star House`;
- attached list: `2026 Membership Email Tier - Brick Buyers`.

**Sendability caveat**

Constant Contact correctly excluded six contacts that were already unsubscribed:

- Warm: `ddlnelson3@usfca.edu`;
- Cold: `lindamitchell555@gmail.com`, `eric@ericbreuerdesigns.com`;
- Brick Buyers: `ssmith@sierracollege.edu`, `frankr@connectmicro.com`, `jss1934@yahoo.com`.

Source cohort counts remain Warm 86, Cold 38, Brick Buyers 30. Constant Contact sendable counts are Warm 85, Cold 36, Brick Buyers 27.

Decision: do not try to resubscribe these people unless the contact explicitly asks to rejoin. Constant Contact stays the source of truth for sendability; Master Portal lists stay the source of truth for review cohorts.

## Decisions, Risks, Learning

**Decisions locked**

- Keep source cohorts intact rather than deleting unsubscribed contacts from the planning lists.
- Use `Decision` as a real task label for approval/discussion items.
- Use initiative as parent grouping and area as broader Fund Development category.
- Keep this smaller than the Mirror/Cockpit initiative system.
- Treat the Constant Contact drafts as staged assets, not approval to send.

**Risks / dependencies**

- The sender decision still matters. Drafts currently use `development@thenorthstarhouse.org`, but production send should wait for explicit approval.
- Constant Contact OAuth works but tokens rotate; future scripts must refresh and persist tokens before API work.
- Unsubscribed contacts will continue to reduce apparent send counts unless reviewers understand the source-count vs. sendable-count distinction.
- No reply triage system exists yet. Replies will land in the chosen sender inbox until a campaign reply workflow is built.

**What surprised us or should change next time?**

The first Constant Contact refresh attempt failed because the OAuth endpoint required `application/x-www-form-urlencoded` POST body parameters, not query parameters. Perplexity grounding helped identify that gotcha.

The Master Portal app's `.env.local` public anon key could read nothing under RLS for backend task writes. The correct live data write path used the Master Portal service role key from `/Users/ender/.claude/.env`.

Constant Contact did not fail the imports; it silently honored existing unsubscribes. That is correct behavior and should be expected in future list staging.

## Threads We Noticed

- The next useful product question is not more architecture. It is draft review, sender approval, and whether these three cohorts are the right first send.
- A later enhancement could expose sendable-vs-source counts directly on list views, but this is not urgent.
- The Membership campaign now has enough structure that future tasks can be added one by one without inventing a new campaign workspace yet.
