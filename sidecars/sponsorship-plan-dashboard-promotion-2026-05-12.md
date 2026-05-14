# Sponsorship Plan Dashboard Promotion - 2026-05-12

## Scope

Source: sandbox app `http://localhost:4001/north-star-donors/`, mirror Supabase `pasamzrwwaqhiwkixpbt`.

Target: Haley production `https://northstarhouse.github.io/north-star-donors/`, live Supabase `uvzwhhwzelaelfhfkvdb`.

Promoted only the approved Sponsorship Plan dashboard task changes for two `tasks` rows.

## Visible Diff Before Promotion

Sandbox showed:

- `Decide whether CAKE should be recorded as Mother's Day in-kind sponsorship`
- CAKE row badges: `Decision`, `Sponsorships`, `Sponsorship Plan`, `Kaelen`
- `Approve Sponsor Packet V2 tier structure`
- Sponsor Packet detail: `In Progress`, `Decision`, `Kaelen`, due `May 14, 2026`, `Sponsorship Plan`, attachment present
- Sponsorship Plan dashboard count: `1 todo · 1 in progress · 0 done`
- Both task detail pages used dashboard-native issue briefs with `Outcome`, `Next`, `Decisions / Questions`, `Blockers`, `Done when`, and `Sources`

Production showed:

- Old CAKE title: `Decide whether Mother's Day macaron discount should be logged as in-kind sponsorship`
- CAKE row was missing `Sponsorships` / `Sponsorship Plan`
- Old Sponsor Packet title: `Draft sponsor packet v2`
- Sponsor Packet due date was missing
- Sponsorship Plan dashboard count: `0 todo · 1 in progress · 0 done`
- Task notes still used older short notes

## Data Promoted

Table: `tasks`

Rows updated:

- `63ec1fc9-3798-40b1-a9bd-18fdc3dbe0ef`
  - Title: `Approve Sponsor Packet V2 tier structure`
  - Status: `in_progress`
  - Label: `Decision`
  - Owner: `Kaelen`
  - Due date: `2026-05-14`
  - Initiative: `20216183-e3bf-42f5-a4ec-5bff03227bc9` (`Sponsorship Plan`)
  - Attachment preserved: `https://northstarhouse.github.io/north-star-donors/sponsorship-plan/sponsor-packet-v2-board-structure.html`
  - Notes replaced with dashboard-native issue brief

- `134c596c-8df9-4a82-aa2a-ecef3d496f9d`
  - Title: `Decide whether CAKE should be recorded as Mother's Day in-kind sponsorship`
  - Status: `todo`
  - Label: `Decision`
  - Owner: `Kaelen`
  - Due date: none
  - Initiative: `20216183-e3bf-42f5-a4ec-5bff03227bc9` (`Sponsorship Plan`)
  - Notes replaced with dashboard-native issue brief

No `task_comments`, `initiatives`, `team_focus_entries`, or code changes were promoted.

## Schema Drift / Omitted Columns

Mirror `tasks` has columns not present in live:

- `blocked_by`
- `domain`

Those columns were omitted from the live write. Live-compatible columns checked after promotion:

- `id`
- `title`
- `label`
- `status`
- `due_date`
- `notes`
- `attachment_url`
- `assigned_to`
- `initiative_id`

Post-write compare found zero remaining diffs for the two target rows across those live-compatible columns.

## Final Production Proof

Production URL hard reloaded with cache-busting query:

`https://northstarhouse.github.io/north-star-donors/?promotionCheck=20260512-sponsorship`

Production dashboard showed:

- To Do: `9`
- In Progress: `2`
- Done: `6`
- `Decide whether CAKE should be recorded as Mother's Day in-kind sponsorship`
- CAKE row badges: `Decision`, `Sponsorships`, `Sponsorship Plan`, `Kaelen`
- Sponsorship Plan dashboard count: `1 todo · 1 in progress · 0 done`

Production task detail proof:

- `https://northstarhouse.github.io/north-star-donors/task/?taskId=63ec1fc9-3798-40b1-a9bd-18fdc3dbe0ef&promotionCheck=20260512-sponsorship`
  - Shows `Approve Sponsor Packet V2 tier structure`
  - Shows `In Progress`, `Decision`, `Kaelen`, due `May 14, 2026`, `Sponsorship Plan`
  - Shows `Open attachment`
  - Notes begin with `Outcome:` and contain the approved dashboard-native issue brief

- `https://northstarhouse.github.io/north-star-donors/task/?taskId=134c596c-8df9-4a82-aa2a-ecef3d496f9d&promotionCheck=20260512-sponsorship`
  - Shows `Decide whether CAKE should be recorded as Mother's Day in-kind sponsorship`
  - Shows `To Do`, `Decision`, `Kaelen`, `Sponsorship Plan`
  - Notes begin with `Outcome:` and contain the approved dashboard-native issue brief
  - Shows `No comments yet`

No visible Linear references were added.
