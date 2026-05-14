# Sandbox to production diff package
Date: 2026-05-11

## Frame

Sandbox/staging URL:

`http://localhost:4001/north-star-donors/`

Production URL:

`https://northstarhouse.github.io/north-star-donors/`

Sandbox Supabase ref:

`pasamzrwwaqhiwkixpbt`

Live Supabase ref:

`uvzwhhwzelaelfhfkvdb`

## Code / UI diff

Current sandbox clone:

- Branch: `master`
- Head: `2185c2f`
- Diff from `origin/master`: none
- Dirty tracked files: none
- Untracked local-only files: `agent-harness/`, `supabase/.temp/`

Diff package baseline:

- Baseline: `e0177b7` (`Fix volunteer group tags to match database values`)
- Sandbox/current head: `2185c2f`

Commits in package:

- `d745653` Move May 7 brief into meetings tab
- `036a5f3` Add static task detail page
- `7804ecb` Make dashboard task titles open details
- `2185c2f` Clean up task detail typography

Files changed from `e0177b7..2185c2f`:

- `AGENTS.md` added project operating notes
- `app/(protected)/meeting-briefs/post-meeting-brief-2026-05-07/page.tsx` added protected May 7 post-meeting brief launcher
- `app/meetings/page.tsx` changed Meetings page behavior/layout; May 7 brief is surfaced through Meetings
- `app/page.tsx` changed dashboard task rows and removed the dashboard archive path as the primary brief history surface
- `app/task/TaskDetailClient.tsx` added task detail page client
- `app/task/page.tsx` added task detail route
- `app/team/[member]/TeamMemberClient.tsx` updated team task linking/behavior

Size:

`7 files changed, 1998 insertions(+), 1596 deletions(-)`

## Production URL check

Static fetch checks:

- `http://localhost:4001/north-star-donors/`: HTTP 200, contains `Development Dashboard`, does not contain `Meeting Archive`
- `http://localhost:4001/north-star-donors/meetings`: HTTP 200
- `https://northstarhouse.github.io/north-star-donors/`: HTTP 200, contains `Development Dashboard`, does not contain `Meeting Archive`
- `https://northstarhouse.github.io/north-star-donors/meetings`: HTTP 200

Note: static HTML checks do not prove protected client data rendered after app-password/localStorage state.

## Supabase mirror-vs-live diff

Compared app-referenced Supabase tables via service-role REST reads. No secrets printed.

Corrected data delta after visual mismatch check:

Table: `tasks`

- Live before correction: `13`
- Mirror before correction: `17`
- Rows upserted to live: `6`
- Live after correction: `17`
- Mirror after correction: `17`
- Remaining mirror-only rows: `0`
- Remaining live-only rows: `0`
- Remaining changed rows across common columns: `0`

Promoted visible dashboard task changes:

- `Decide whether Mother's Day macaron discount should be logged as in-kind sponsorship`
- `Design event follow-up opt-in process`
- `Research funding options for bat netting and upstairs doors`
- `Port current pursued grants into Development Dashboard`
- Existing USDA task updated from long URL title to `Research USDA Community Facilities grant fit`
- Related task row updates needed for mirror parity

Table: `initiatives`

- Live before correction: `3`
- Mirror before correction: `4`
- Added live initiative: `Grants`
- Live after correction: `4`
- Mirror after correction: `4`
- Remaining mirror-only rows: `0`
- Remaining live-only rows: `0`
- Remaining changed rows across common columns: `0`

Note: mirror-only columns omitted because live schema does not have them:

- `initiatives`: `description`, `owner`, `started_at`, `target_close_at`
- `tasks`: `domain`, `blocked_by`

Table: `task_comments`

- Live after correction: `6`
- Mirror after correction: `6`
- Remaining mirror-only rows: `0`
- Remaining live-only rows: `0`
- Remaining changed rows: `0`

Initial data delta also found:

Table: `team_focus_entries`

- Live count: `4`
- Mirror count: `6`
- Mirror-only rows: `2`

Mirror-only rows:

1. `8cc34af0-3f26-47d8-811f-540d799a1cdf`
   - `member`: `kaelen`
   - `section`: `current`
   - `content`: `Research local banner-space costs`
   - `created_at`: `2026-05-11T00:45:45.139082+00:00`

2. `dfddc2c8-df0a-48b4-93da-eba47117f659`
   - `member`: `kaelen`
   - `section`: `current`
   - `content`: `Clarify respectful next step for Nisenan / Arts Council intro`
   - `created_at`: `2026-05-11T00:52:54.725639+00:00`

Dashboard/task tables checked directly:

- `development_tasks`: no reachable table diff found in direct dashboard subset check
- `tasks`: no reachable table diff found in direct dashboard subset check
- `initiatives`: no diff
- `team_focus_entries`: two mirror-only rows above
- `development_meetings`: no diff
- `protected_documents`: no diff
- `outreach_board`: no diff
- `ideas`: no diff
- `idea_comments`: no diff
- `coordination_items`: no diff

## Current local repo caveat

Parent repo branch `codex/merge-local-north-star-donors` has unrelated dirty work:

- `app/volunteers/page.tsx`
- `components/EmailGroupButton.tsx`
- `lib/supabase/client.ts`
- `lib/send-email.ts`
- `Captain's Log/`
- `sidecars/`
- `supabase/.temp/`

Do not include those in the sandbox-to-production package unless separately approved.

## Package interpretation

Promote as code/UI:

- May 7 post-meeting brief route and Meetings integration
- Task detail page route/client
- Dashboard task-title navigation to task detail
- Task detail typography cleanup

Promote as data only if approved:

- Two `team_focus_entries` rows for Kaelen current focus

Status: promoted to live Supabase on 2026-05-11 and verified.

- Live `team_focus_entries` count after promotion: `6`
- Mirror `team_focus_entries` count after promotion: `6`
- Remaining mirror-only rows: `0`
- Remaining live-only rows: `0`
- Remaining changed rows: `0`

## Chrome DevTools verification after correction

Production URL reloaded with cache ignored:

`https://northstarhouse.github.io/north-star-donors/`

Rendered production snapshot now shows:

- `To Do 10`
- `Decide whether Mother's Day macaron discount should be logged as in-kind sponsorship`
- `Design event follow-up opt-in process`
- `Research funding options for bat netting and upstairs doors`
- `Port current pursued grants into Development Dashboard`
- `Research USDA Community Facilities grant fit`
- `Grants` option in initiative filter
- `Grants 1 todo · 0 in progress · 0 done`

Do not promote by accident:

- Parent repo volunteer/email/Supabase client dirty changes
- Local `agent-harness/`
- Local Supabase temp files
