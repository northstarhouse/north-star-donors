# North Star Sandbox No-Diff Wrap - 2026-05-11

## Summary

Updated the local `northstar-sandbox` skill and brought the mirror-backed localhost sandbox into no-diff state against Haley production for checked dashboard tables.

## Skill Updated

File:

`C:\Users\ender\.codex\skills\northstar-sandbox\SKILL.md`

Change:

- Added **No-Diff Readiness Workflow**.
- The skill now requires `verify --diff-live --json` or `diff-live` when the user expects localhost/sandbox to match Haley production.
- The skill now distinguishes `no diff across checked dashboard tables` from a literal full clone.
- The skill should not imply `http://localhost:4001/north-star-donors/` is identical to Haley production unless checked tables have been diffed.

## Sandbox State

Sandbox URL:

`http://localhost:4001/north-star-donors/`

Mirror Supabase ref:

`pasamzrwwaqhiwkixpbt`

Live Supabase ref:

`uvzwhhwzelaelfhfkvdb`

Verified:

- Sandbox server is running on port `4001`.
- `/north-star-donors/` returns HTTP `200`.
- Page contains `Development Dashboard`.
- `/north-star-donors/meetings` returns HTTP `200`.
- App is using mirror Supabase.
- App is not using live Supabase.

## Mirror Sync

Initial diff found two stale mirror `tasks` rows compared to Haley live:

- `Confirm Constant Contact sender address`
- `Send Long-Lapsed Email-Only Renewal to 11 recipients`

Action:

- Synced only those two rows from live Supabase into mirror Supabase.
- No live production write was performed.

Final checked dashboard table diff:

- `tasks`: 0 mirror-only, 0 live-only, 0 changed
- `initiatives`: 0 mirror-only, 0 live-only, 0 changed
- `task_comments`: 0 mirror-only, 0 live-only, 0 changed
- `team_focus_entries`: 0 mirror-only, 0 live-only, 0 changed

Known schema drift:

- Mirror-only `tasks` columns: `blocked_by`, `domain`
- Mirror-only `initiatives` columns: `description`, `owner`, `started_at`, `target_close_at`

## Linear State

Membership Renewal Campaign:

- `THE-6` Long-lapsed email-only renewal: Done
- `THE-12` Monitor first long-lapsed renewal send results: Todo
- `THE-13` Prepare Warm Touch 1 membership renewal send: Todo
- `THE-14` Prepare Cold Touch 1 membership renewal send: Todo
- `THE-15` Prepare Brick Buyers Touch 1 membership renewal send: Todo

## Resume Point

Next chat can start with:

`Use northstar-sandbox and drilldown-development-dashboard on the v2 sponsorship packet draft.`

Default environment for DDD:

- Local sandbox mirror, not Haley live.
- Use Haley live only if explicitly requested as production/live/Haley/GitHub Pages, or for promotion verification.
