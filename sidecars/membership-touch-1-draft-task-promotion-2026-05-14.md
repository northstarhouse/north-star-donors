# Membership Touch 1 Draft Task Promotion - 2026-05-14

## Target

- Source: sandbox dashboard at `http://localhost:5173/north-star-donors/`
- Target: production dashboard at `https://northstarhouse.github.io/north-star-donors/`
- Task: `Build Touch 1 draft campaigns in Constant Contact`
- Task id: `00ad353c-fd15-4457-8691-3c5668025966`

## Approved Change

Promote the cleaned dashboard task state for the Constant Contact Touch 1 draft work.

The task is now `In Progress` instead of `To Do` because the Warm Touch 1 draft is ready for send approval, while Cold and Brick Buyers still need their final sender, copy, audience, and proof checks before send approval.

## Rows Promoted

- `tasks`: updated the existing task row with the sandbox status and human-readable notes.
- `task_comments`: inserted the sandbox readiness comment by `Codex`.
- Comment id: `4d99195b-d1e7-444c-9e6d-b36d65b6c0d3`

No code files were changed for the promotion.

## Rendered UI Proof

Before promotion, production showed:

- Main dashboard: `To Do 8`, `In Progress 2`, `Done 6`
- `Build Touch 1 draft campaigns in Constant Contact` still appeared in `To Do`
- `Membership Email Campaign` card showed `3 todo`, `0 in progress`, `2 done`
- Task detail notes contained raw Constant Contact ids and operational dump text

After promotion and hard reload, production showed:

- Main dashboard: `To Do 7`, `In Progress 3`, `Done 6`
- `Build Touch 1 draft campaigns in Constant Contact` moved out of `To Do`
- `Membership Email Campaign` card showed `2 todo`, `1 in progress`, `2 done`
- Task detail page showed status `In Progress`
- Task detail notes were readable and structured as `Outcome`, `Current draft status`, `Audience note`, `Next`, and `Done when`
- Task detail page showed one readable readiness comment: `Warm Touch 1 readiness update, May 14`

## Scope Note

This promotion was scoped to the Touch 1 draft task only. Other sandbox-vs-production differences were not promoted.

## Send Safety

This dashboard promotion did not send or schedule any Constant Contact email. It only moved the verified work state and notes into production dashboard data.
