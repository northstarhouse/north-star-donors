# Membership Brick Buyers Touch 1 Dashboard Promotion - 2026-05-14

## Target

- Source: sandbox dashboard at `http://localhost:5173/north-star-donors/`
- Target: production dashboard at `https://northstarhouse.github.io/north-star-donors/`
- Task: `Build Touch 1 draft campaigns in Constant Contact`
- Task id: `00ad353c-fd15-4457-8691-3c5668025966`

## Approved Change

Promote the Brick Buyers Touch 1 readiness update from sandbox to production.

This was scoped to the existing Touch 1 draft task only. It did not create new dashboard tasks or alter unrelated dashboard rows.

## Rows Promoted

- `tasks`: updated the existing task notes so Warm, Cold, and Brick Buyers Touch 1 all read as ready for send approval.
- `task_comments`: inserted the Brick Buyers readiness comment by `Codex`.
- Comment id: `0c01c737-c242-4958-bd2f-5949e571d64a`

No code files were changed for this promotion.

## Production Proof

After database promotion and production hard reload, the production task detail page showed:

- Task status still `In Progress`.
- Warm Touch 1 ready for send approval.
- Cold Touch 1 ready for send approval.
- Brick Buyers Touch 1 ready for send approval.
- Notes now say the next decision is send order, send timing, and who watches `info@thenorthstarhouse.org`.
- Comments count is `3`.
- Warm, Cold, and Brick Buyers readiness comments are all visible and human-readable.

## Send Safety

This dashboard promotion did not send or schedule any Constant Contact email.

All three Touch 1 drafts are ready for send approval. The remaining work is send decision, send order, and reply monitoring.
