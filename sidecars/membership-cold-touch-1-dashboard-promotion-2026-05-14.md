# Membership Cold Touch 1 Dashboard Promotion - 2026-05-14

## Target

- Source: sandbox dashboard at `http://localhost:5173/north-star-donors/`
- Target: production dashboard at `https://northstarhouse.github.io/north-star-donors/`
- Task: `Build Touch 1 draft campaigns in Constant Contact`
- Task id: `00ad353c-fd15-4457-8691-3c5668025966`

## Approved Change

Promote the Cold Touch 1 readiness update from sandbox to production.

This was scoped to the existing Touch 1 draft task only. It did not promote unrelated sandbox differences or create any new dashboard task.

## Rows Promoted

- `tasks`: updated the existing task notes so Cold Touch 1 now reads as ready for send approval.
- `task_comments`: inserted the Cold readiness comment by `Codex`.
- Comment id: `1b27a86b-9e09-4109-99d5-556798153229`

No code files were changed for this promotion.

## Production Proof

After database promotion and production hard reload, the production task detail page showed:

- Task status still `In Progress`.
- Warm Touch 1 ready for send approval.
- Cold Touch 1 ready for send approval.
- Brick Buyers Touch 1 still pending final sender, copy, audience, and proof checks.
- Audience note includes the guardrail that Cold contacts recently received North Star newsletter email, so the approved copy does not claim they have not heard from us.
- Comments count is `2`.
- The Cold Touch 1 readiness comment is visible and human-readable.

## Send Safety

This dashboard promotion did not send or schedule any Constant Contact email.

Warm and Cold are ready for send approval. Brick Buyers is still the remaining Touch 1 final-pass item.
