# Drilldown sidecar - Linear Membership Renewal project buildout
Date: 2026-05-11
Parent task: Build out Linear project `Membership Renewal Campaign`
Session ceiling: Organize the membership renewal campaign enough to execute, while learning Linear project fields and creating a reusable PM pattern as a byproduct.

## Open todos

* Define project-level metadata
  - Scope locked: membership renewal campaign only for this session; broader donor operations hub later.
  - Primary outcome: get the campaign organized enough to execute.
  - Byproduct: reusable PM pattern for future membership/donor work.
  - Project summary applied: `Organize and execute the North Star membership renewal campaign, starting with urgent long-lapsed email outreach.`
  - Supabase mirror checked via service-role read-only query, ref `pasamzrwwaqhiwkixpbt`.
  - Source initiatives found: `Membership Email Campaign`, `Recently Lapsed Member Letter`.
  - Source protected docs found: Warm/Cold Touch 1 drafts and related campaign materials.
  - Source tasks found: reply monitoring plan, sender address, audience groups, Touch 1 campaign build, long-lapsed 11-person send.
  - User provided full campaign overview text: `North Star Historic Conservancy - Constant Contact / 2026 Membership Email Campaign`.
  - Authoritative campaign frame: one May-July 2026 membership campaign split into Warm, Cold, and Brick Buyers email tiers.
  - Main blockers before send: sender identity, Touch 1 approval, send order, reply handling.
  - Constant Contact drafts exist but are not sent: Warm `A note from the North Star House`, Cold `It's been a while`, Brick Buyers `Your brick at the North Star House`.
  - Sendability counts: Warm 86 source / 85 sendable, Cold 38 / 36, Brick Buyers 30 / 27.
  - Project description applied in Linear from the full campaign overview.
  - Project status changed from `Backlog` to `In Progress`; Linear set start date to `2026-05-12`.
  - Project priority changed from `Medium` to `High`.
  - Project lead set to `Kaelen Jennings`.
  - Project dates set: start `2026-04-30`, target `2026-07-31`.
* Mine local sidecars and Captain's Logs into campaign issues
* Structure urgent send issue `THE-6`
* Surface blockers, gates, and next actions in Linear

## Notes / observations

- `THE-6` is specifically `Long-lapsed email-only renewal`, not the whole campaign.
- Project URL: https://linear.app/thenorthstarhouse/project/membership-renewal-campaign-2b2e3a4a8829
- Source repo: `C:\Users\ender\.claude\projects\north-star-donors-gh`
- Issue creation rule: an issue is a micro-brief, not a note dump. Do not leave the issue flow until future-you or an agent can resume it.
- Automation research decision: use a Codex recurring check or manual checklist before webhooks. Rule candidate: when `First production send` is Done and `Assign reply handling` is Done or assigned, prompt Kaelen to lower project priority from High to Medium.

## Issue exit checklist

An issue is ready when it has:

- Outcome: what changes when done
- Owner: one accountable person
- Next action: one concrete verb/object/location step
- Blockers: concrete blockers or `none`
- References: source files, links, notes, records
- Acceptance criteria: 2-5 testable bullets
- Status / priority / due date: only real metadata
- Resume context: what was done, what's next, where to look
- Perplexity research supports an issue exit checklist: each issue should act like a micro-brief before leaving creation/edit flow.
- Draft issue exit checklist: outcome, owner, next action, blockers, source references, acceptance criteria, status/priority/date, and resume context.
- Linear automation research: native Linear supports workflow/status/project structures and integration-triggered issue updates, but project-priority downgrade from custom multi-condition logic is partial/not a clean native fit.
- Priority automation decision: do not fully automate priority drop yet. Use a Codex recurring/manual check: when `First production send` is Done and `Assign reply handling` is Done or assigned, prompt Kaelen to lower project priority from High to Medium.
- Access-path fork: official Codex Linear plugin is convenient but curated/incomplete; direct GraphQL API, official TypeScript SDK, or third-party `linear-cli` may be better when project metadata/labels/milestones/automation exceed plugin coverage.

## Gate candidates

- Promote broader donor operations hub into separate Linear project or initiative later.
- Decide whether project priority downgrade should be manual, Codex recurring check, or webhook/API script.
- Research/choose Linear access path for robust local PM automation: plugin-first vs GraphQL/SDK/CLI.
- Convert the eventual issue-exit checklist into a slash command, skill, or `/ddd` rule so issues are not considered closed until outcome, next action, blockers, sources, owner, status/priority/due date, and resume context are present.
