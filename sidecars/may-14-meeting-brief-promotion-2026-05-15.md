# May 14 Meeting Brief Promotion - 2026-05-15

## Source And Target

- Source UI: `http://localhost:4001/north-star-donors/meetings/`
- Target UI: `https://northstarhouse.github.io/north-star-donors/meetings/`
- Source Supabase mirror: `pasamzrwwaqhiwkixpbt`
- Target Supabase live: `uvzwhhwzelaelfhfkvdb`

## Visible Diff Before Promotion

Sandbox showed:

- `May 14, 2026 Notes 10:14 AM`
- Notes file: `Donor app development brief - May 14, 2026`
- Notes opened the clean May 14 meeting brief without a duplicate app sidebar.

Production showed:

- `May 7, 2026 Agenda Notes 10:00 AM`
- Missing the May 14 meeting row and brief link.

## Data Promoted

Table: `protected_documents`

- Inserted slug `donor-app-development-2026-05-14` into mirror and live.
- Title: `Donor app development brief - May 14, 2026`
- Status: `draft`
- HTML length: `17140`
- Live and mirror refs verified by direct read after insert.

## Code Promoted

- Adds the May 14 built-in meeting row to the Meetings page.
- Adds protected route `/meeting-briefs/donor-app-development-2026-05-14/`.
- Leaves unrelated local dirty files out of the promotion package.

## Verification Notes

- Local route returned `200`.
- Target files passed ESLint.
- Browser verified sandbox Meetings page showed the May 14 row and opened the brief.
- Production verification still required after GitHub Pages deploy completes.
