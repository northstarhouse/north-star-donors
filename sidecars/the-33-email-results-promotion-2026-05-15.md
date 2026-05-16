# THE-33 Email Results Promotion - 2026-05-15

## Source And Target

- Source sandbox URL: `http://localhost:4001/north-star-donors/data/`
- Promotion worktree URL: `http://localhost:4002/north-star-donors/data/`
- Target production URL: `https://northstarhouse.github.io/north-star-donors/data/`
- Sandbox/mirror ref: `pasamzrwwaqhiwkixpbt`
- Live ref: `uvzwhhwzelaelfhfkvdb`

## Visible Diff Before Promotion

Sandbox / clean promotion worktree showed:

- `Data -> Email Results` opens the Constant Contact recipient workbench.
- KPIs: Sent `143`, Opened `48`, Clicked `2`, Bounced `3`, Unsubscribed `0`.
- Campaign selector includes Warm Touch 1, Cold Touch 1, and Brick Buyers Touch 1.
- Recipient table exposes person, engagement, last activity, clicked link.
- Recipient filters: All, Clicked, Opened, Not opened, Bounced, Opted out.
- `Orders` tab remains present in the clean production-based worktree.

Production before promotion showed:

- `Data -> Email Results` opened the old manual email-campaign UI.
- Visible old controls included `Add Campaign`.
- No Constant Contact recipient workbench was visible.

## Code And Data Promoted

- `app/data/page.tsx`
  - Replaced the Email Results tab body with the Constant Contact workbench.
  - Preserved the current production `Orders` tab from `master`.
  - Deferred renewal/member attribution in the UI with `Renewal matching deferred`.
- `scripts/constant-contact-email-analytics.mjs`
  - Added recipient-level Constant Contact tracking fetches.
  - Tracking endpoints: sends, opens, clicks, didnotopens, bounces, optouts.
- `public/data/constant-contact-email-analytics.json`
  - Added static snapshot with 3 campaigns and 143 recipients.
- `package.json`
  - Added `sync:constant-contact`.

## Verification Before Push

- Clean production-based worktree was created from `upstream/master`.
- `npm run build` succeeded with local Supabase env mapped to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Rendered check at `http://localhost:4002/north-star-donors/data/` showed:
  - `Orders` tab present.
  - `Email Results` workbench present.
  - Constant Contact KPIs and recipient rows present.

## Notes

- No Supabase data rows were promoted for this feature; the data is a static public snapshot.
- Renewal attribution remains optional future enrichment and was not promoted.
