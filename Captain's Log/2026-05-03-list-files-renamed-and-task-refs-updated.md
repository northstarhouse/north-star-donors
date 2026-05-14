---
type: "captains-log"
date: "2026-05-03"
slug: "list-files-renamed-and-task-refs-updated"
status: "complete"
created: "2026-05-03"
---

# Captain's Log — List Files Renamed + Task Refs Updated

> Cleaned up the `Membership Drive/lists-csv/` folder so the filenames match what each list actually is, derived a missing "no-mail no-email" cohort, then audited all 26 mirror-portal tasks and updated the 8 that referenced the old paths or had relevant context to add.

## Status & purpose

**What got done?**

File ops in `Membership Drive/lists-csv/`:
- Deleted `email-enrichment-2026-04-30.csv` (it was the audit log of the email-search effort, not a sendable list — kept the sibling `.md` summary).
- Renamed 5 files to be self-documenting at a glance:
  - `Brick-Purchases-Not-Members-2026-04-30.csv` → `bricks-not-members-2026-04-30.csv`
  - `Lapsed-2026-04-30.csv` → `recently-lapsed-mailable-2026-04-30-(some-haley-tail-pending).csv`
  - `Long Lapsed-2026-04-30.csv` → `long-lapsed-mailable-2026-04-30.csv`
  - `Long-Lapsed-Email-Only-2026-05-02.csv` → `long-lapsed-undeliverable-email-recovered-2026-05-02.csv`
  - `long-lapsed-merge.csv` → `long-lapsed-mailed-subset-2026-04-30.csv`
- Created new file `long-lapsed-unreachable-2026-05-03.csv` (18 names — long-lapsed who got NEITHER physical letter NOR email-only renewal). Math: 45 long-lapsed pool − 16 actually mailed − 11 email-recovered = 18, zero overlap.

Task ops on the mirror dashboard (`master-portal-fork.vercel.app`):
- Audited all 26 tasks across 2 initiatives + 1 unassigned for stale list references.
- Patched 8 tasks via PostgREST PATCH:
  - `b57a9ee3` Pull Brick Purchases — fixed stale path
  - `64e52fd4` Send to 11 — fixed stale path (in-place string replace + audit-marker note)
  - `68735157` Mail ~69 letters — appended source-file map (16 long-lapsed mailed + 57 recently-lapsed pool + 45 full long-lapsed pool)
  - `1ca92a79` Haley check-in — appended roster file for envelope-status ask (a)
  - `92efadfb` Bricks cold-conversion — appended recipient list path
  - `73024274` Mailed-cohort follow-up trigger — appended cohort source files
  - `5a93ccbd` Derive Current Donors — appended exclusion-lists block (5 lists with paths + counts) and exclusion derivation rule
  - `f6e5d2c4` retitled "Partial-address recovery for unreachable donors" → "Partial-address recovery for 18 long-lapsed unreachables", rewrote notes to point at the new file

**Why was it done?**
Hit the actual problem mid-conversation: every reference to "current donors" or "lapsed" was fuzzy because the filenames didn't match what they were ("Lapsed" vs "Long Lapsed" vs "Long-Lapsed-Email-Only" vs "long-lapsed-merge" — couldn't keep them straight, and dashboard tasks pointed at names that don't exist anymore after the renames). Cleaning the folder was load-bearing for being able to talk about cohorts coherently.

**What was it supposed to accomplish?**
- Make the lists folder self-documenting so any glance answers "what is this file?"
- Make the dashboard tasks point at real, current file paths
- Surface the missing 18-name cohort that wasn't tracked anywhere

## Scope & next moves

**What's still left to do on the whole?**
- The long-lapsed math used file row-counts; haven't verified the 18 names against the source-of-truth donor table (could have orphans/dupes that distort the count).
- Brick cold-conversion and recently-lapsed cohort still need same-style audit if their lists ever get re-pulled or expanded.
- The "lists on the site" idea (materializing operating cohorts as DB rows in the portal `lists` table so Haley + Kaelen see the same definitions) was discussed and explicitly held off on — not on the dashboard yet.

**Immediate next steps**
None required from this work — files and tasks are in sync.

**Deadlines**
None — this was infrastructure, not deliverable.

**Owners**
Kaelen.

## Resource & capacity

**What did this cost?**
~30 minutes of focused conversation + tool calls. Cheap.

**Who else got pulled in?**
Nobody. Pure local operation on vault files + mirror DB.

**What did NOT get done because we did this?**
The slide-deck content drafting that was in flight when the audit-list-files thread peeled off. Slide deck still due tomorrow (2026-05-04) and only Touch 1 breakdown is solid; touches 2-N still owed.

## Risk & dependency

**What could go wrong now that this is in motion?**
- The 18-unreachable file is correct relative to the long-lapsed pool of 45 we have on disk, but if that pool itself was a partial pull from the portal, there are silently-missing names that aren't represented anywhere in the cohort math.
- Anyone working off cached terminal output or a stale captain's log will reference the old filenames and be confused. Two of today's earlier captain's logs already mention old names.

**What are we waiting on someone else for?**
Nothing.

**What assumption are we making that we can't yet verify?**
- That the 16-name `long-lapsed-mailed-subset-2026-04-30.csv` actually corresponds 1:1 to letters that physically went out the door at the post office. Inferred from name overlap + captain's-log mention of "16 long-lapsed mailed," but no per-letter receipt confirmation.

## Decisions, stakeholders, learning

**Who needs to know this happened?**
- Future-Kaelen + future-Claude sessions, because filenames in old captain's logs and task notes elsewhere will not match.

**Has the right person been thanked or asked?**
N/A — local op.

**What did we decide, and why? What did we explicitly choose NOT to do?**
- **Naming convention:** lowercase-hyphen-yyyy-mm-dd, with parenthetical caveat for files where the cohort has known incompleteness (e.g., the Haley-tail flag).
- **Don't materialize lists on the site yet** — discussed it (would let Haley + Kaelen see the same cohort definitions in the portal `lists` table), but explicitly held off. CSV-on-disk is good enough for now.
- **Conservative naming for the 11-cohort** — don't pretend to know the exact filter that produced them. Used "undeliverable-email-recovered" rather than baking in a filter we couldn't verify.
- **Append-only updates to task notes** — every patched task got a `[2026-05-03 file-rename audit]` marker appended rather than wholesale rewrites, so the breadcrumb history of how the notes evolved is preserved.

## 🔍 Threads we noticed

- **Materialize cohorts in the portal `lists` table** — explicitly deferred. Right move for shared visibility with Haley but needs a "what are the operating cohorts" drill first.
- **`long-lapsed-merge.csv` was the actual mail-merge input** — provenance was a guess until name-overlap with the mailed-16 confirmed it. If we re-run mail merges, name the output file accordingly from the start.
- **The 11-cohort filter is unknown** — we know the 11 are long-lapsed donors with email and no usable address, but the exact "no usable address" rule that produced them isn't documented. Worth recovering if we ever want to re-derive.
