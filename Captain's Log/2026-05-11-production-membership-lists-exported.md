---
type: "captains-log"
date: "2026-05-11"
slug: "production-membership-lists-exported"
status: "complete"
created: "2026-05-11"
---

# Captain's Log: Production Membership Lists Exported

> Haley production's current Lists page was exported locally into the Membership Drive so the campaign list state is preserved even though the sandbox browser session was stuck behind the local app-password gate.

## Status & Purpose

The user asked to stop fighting the localhost `/lists/` mismatch and instead pull down the lists visible at `https://northstarhouse.github.io/north-star-donors/lists/`.

The export was taken from Haley production Supabase (`uvzwhhwzelaelfhfkvdb`) behind the production Lists page and saved alongside the existing Membership Drive Constant Contact campaign files.

## What Got Done

Created local export folder:

`C:\Users\ender\.claude\projects\Vault\Membership Drive\Constant Contact Campaign\production-lists-export-2026-05-11`

Exported files include:

- `manifest.csv`
- `manifest.json`
- `README.md`
- `triage.md`
- five production dashboard list CSVs
- one smart No Address CSV
- five production tag segment CSVs

## Exported Segments

- `2026 Membership Email Tier - Brick Buyers`: 29 rows
- `2026 Membership Email Tier - Cold`: 38 rows
- `2026 Membership Email Tier - Warm`: 86 rows
- `Did not receive mailer`: 34 rows
- `Membership Mailer List 2026`: 108 rows
- Smart `No Address`: 52 rows
- Tag `2026 Membership Letter Sent - Snail Mail`: 68 rows
- Tag `Board Member`: 4 rows
- Tag `Current Volunteer`: 3 rows
- Tag `Do Not Solicit`: 3 rows
- Tag `No address`: 78 rows

## Triage

The export captures dashboard list/tag membership, not send-ready email recipient lists. The production dashboard donor rows did not have email values in `donors.email`, while the older Constant Contact campaign CSVs do have email columns filled.

Warm and Cold production counts match the older campaign CSV counts:

- Warm: 86 production, 86 older campaign CSV
- Cold: 38 production, 38 older campaign CSV

Brick Buyers changed by count:

- Production dashboard list: 29
- Older campaign CSV: 30

Treat production as current dashboard truth. Keep the older 30-row Brick Buyers CSV as a campaign-build artifact until the missing/removed person is intentionally reconciled.

`Did not receive mailer` and `Membership Mailer List 2026` are now locally preserved and likely relevant to membership mailer exception handling.

Smart `No Address` and tag `No address` are different objects. The smart list is computed from blank/null address and has 52 donors; the manual tag has 78 donors.

`Do Not Solicit` has 3 donors and should be checked before any membership send.

## Decisions

- Export from production because the user explicitly named Haley's production Lists URL.
- Store the data in the Vault Membership Drive, next to existing Constant Contact campaign assets.
- Do not paste donor rows into chat.
- Treat `manifest.csv` as the starting point for later navigation.
- Treat `triage.md` as the human-readable summary of what the export means.

## Next Moves

- Use Constant Contact or older campaign CSVs when actual send-recipient email addresses are required.
- Reconcile Brick Buyers 29 vs older Brick Buyers 30 before relying on the old 30-row CSV.
- Do not merge smart `No Address` and tag `No address` without deciding whether the tag means something beyond blank address data.

## Threads We Noticed

- The localhost sandbox `/lists/` issue was session-gate related at the browser level, not proof that production lists were absent from the mirror.
- The sandbox clone tooling still should not be called a perfect clone until protected routes, browser sessions, and all list tables are verified route-by-route.
