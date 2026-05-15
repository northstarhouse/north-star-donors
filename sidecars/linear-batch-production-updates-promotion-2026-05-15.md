# Linear Batch And Production Updates Promotion - 2026-05-15

## Source And Target

- Source UI: `http://localhost:4001/north-star-donors/`
- Target UI: `https://northstarhouse.github.io/north-star-donors/`
- Source Supabase mirror: `pasamzrwwaqhiwkixpbt`
- Target Supabase live: `uvzwhhwzelaelfhfkvdb`

## Visible Diff Before Promotion

Sandbox showed:

- `To Do 13`, `In Progress 3`, `Done 6`
- Area filter included `Development`
- Initiative filter included `Development Dashboard`
- New visible tasks:
  - `Add production changelog to donor app`
  - `Design person-focused dashboard view`
  - `Clean up North Star 2FA and third-party app mailbox ownership`
  - `Plan postal follow-up workflow after email cohort results`
  - `Add Constant Contact email analytics to Data section`
- `Approve Sponsor Packet V2 tier structure` carried the May 14 tier decisions in mirror notes.
- Sidebar included a bottom `Production Updates` link.
- `/production-updates/` rendered a day-grouped production update log.

Production showed:

- `To Do 3`, `In Progress 2`, `Done 12`
- No `Development` area filter.
- No `Development Dashboard` initiative.
- Missing the five new dashboard tasks.
- No bottom `Production Updates` link or route.

## Data Promoted

Tables: `initiatives`, `tasks`

- Created live initiative `Development Dashboard`.
- Updated live task `Approve Sponsor Packet V2 tier structure`.
- Created live tasks:
  - `Add Constant Contact email analytics to Data section`
  - `Plan postal follow-up workflow after email cohort results`
  - `Clean up North Star 2FA and third-party app mailbox ownership`
  - `Design person-focused dashboard view`
  - `Add production changelog to donor app`

Live schema drift handled:

- Mirror-only initiative columns omitted from live: `description`, `owner`, `started_at`, `target_close_at`.
- Mirror-only task columns omitted from live: `domain`, `blocked_by`.

## Code Promoted

- Added `/production-updates/` route.
- Added bottom-pinned `Production Updates` sidebar link.
- Made sidebar sticky to keep the bottom link visible.
- Added distinct area/initiative chip colors in dashboard, task detail, and team member task lists.
- Fixed touched-file hook lint issues in Sidebar and team member photo URL handling.
- Excluded prototype and scratch routes from production package.

## Verification Before Push

- Mirror/live rows match across live-compatible columns for the promoted initiative and six target tasks.
- Focused ESLint passed with warnings only for existing `<img>` usage.
- Production build passed with live public Supabase env.

## Final Production Chrome Proof

- Pending until GitHub Pages deploy completes.
