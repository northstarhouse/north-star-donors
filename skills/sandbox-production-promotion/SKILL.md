---
name: sandbox-production-promotion
description: Use when promoting North Star sandbox, staging, mirror, or localhost changes into Haley production; compare rendered UI first, map approved diffs to code and Supabase mirror/live data, push only intended changes, and verify production with Chrome DevTools before claiming done.
---

# Sandbox Production Promotion

Promote approved North Star sandbox changes into Haley production without confusing code state, database state, and live browser state.

This skill exists because a prior promotion failed: Git looked pushed, one Supabase table was synced, but production still visibly differed from localhost (`To Do 6` vs `To Do 10`). The correct source of truth is the rendered sandbox UI compared against rendered production, then the data/code that explains that UI diff.

## Known North Star Targets

- Sandbox app: `http://localhost:4001/north-star-donors/`
- Production app: `https://northstarhouse.github.io/north-star-donors/`
- Sandbox Supabase mirror ref: `pasamzrwwaqhiwkixpbt`
- Live Supabase ref: `uvzwhhwzelaelfhfkvdb`
- Credentials source: `$env:USERPROFILE\.claude\.env`
- Sandbox clone: `<repo-root>\sandbox\north-star-donors`
- Production repo workspace: `<repo-root>`

Do not print secrets. Key names and Supabase refs are fine.

## Non-Negotiable Rule

Never say "merged," "pushed," "done," or "production matches" from Git status alone.

Completion requires:

1. Production URL hard reloaded.
2. Chrome DevTools snapshot of production taken after reload.
3. Target sandbox-visible rows/counts/links present in production.
4. Relevant live Supabase rows match mirror across live-compatible columns.
5. Git remote state checked if code changed.

## Workflow

### 1. Restate The Promotion Target

State the source and target:

- Source: sandbox/localhost URL and mirror Supabase.
- Target: Haley production URL and live Supabase.

Name the target surface in plain language, for example:

- Development Dashboard task list
- Meetings page / May 7 brief
- Team member page
- Sponsorship page

If the target surface is unclear, ask one question.

### 2. Capture Rendered UI Diff First

Use Chrome DevTools or browser automation to inspect both pages. If one is already open, use it; otherwise open:

- `http://localhost:4001/north-star-donors/`
- `https://northstarhouse.github.io/north-star-donors/`

Compare visible facts before touching Git or Supabase:

- Counts (`To Do`, `In Progress`, `Done`, card totals)
- Visible row titles
- Filters/options
- Links and routes
- Sidebar/nav entries
- Important labels, owners, dates, badges
- Missing or stale page sections

Write a terse diff list:

```text
Sandbox shows:
- To Do 10
- Research funding options for bat netting and upstairs doors

Production shows:
- To Do 6
- Missing bat-netting task
```

This visible diff becomes the update package. Do not bury it under raw database summaries.

### 3. Map Visible Diff To Code And Data

Only after the rendered diff is clear, identify the backing source.

For code/UI:

- Check sandbox branch/head and production remote head.
- Diff against the correct baseline, not only current `origin/master`.
- If sandbox already equals production code, code is not the remaining blocker.

For Supabase:

- Use `$env:USERPROFILE\.claude\.env`.
- Compare mirror and live for tables that can explain the visible diff.
- Prefer target tables first. For dashboard tasks, check:
  - `tasks`
  - `initiatives`
  - `task_comments`
  - `team_focus_entries`
- Compare by row id, row count, title/content, status, labels, owner/assignee, initiative, timestamps, and common-column hashes.
- Account for schema drift: mirror may contain columns live does not. Upsert only live-compatible columns unless explicitly performing a schema migration.

Do not rely on "most tables match" if the UI still differs.

### 4. Promote Approved Deltas

The user's standing intent for this workflow: changes vetted in sandbox are approved to influence Haley production.

Still keep the package scoped:

- Promote only rows/code that explain the visible sandbox-vs-production diff.
- Do not include unrelated dirty files in the parent repo.
- Do not copy local temp files, agent harnesses, or sidecars into production code.
- Preserve ids and timestamps for promoted data unless a specific table requires generated ids.

Write order for common dashboard data:

1. Parent/reference rows such as `initiatives`
2. Main rows such as `tasks`
3. Child rows such as `task_comments`
4. Side rows such as `team_focus_entries`

Use idempotent upserts where possible and verify before/after counts.

### 5. Verify In Three Layers

Layer A: Database

- Recompare mirror and live for the relevant tables.
- Report counts and remaining mirror-only/live-only/changed rows.
- Changed rows should be zero across live-compatible columns for the target tables.

Layer B: Code/Git

- If code changed, verify remote branch contains the intended commits.
- Do not confuse a local branch with deployed production.
- If GitHub Pages deployment lag is possible, verify the live URL, not only `git ls-remote`.

Layer C: Chrome DevTools

- Hard reload production with cache ignored.
- Take a fresh snapshot after reload.
- Verify the exact visible facts from Step 2 now match production.

Example final production proof:

```text
Production after hard reload shows:
- To Do 10
- Decide whether Mother's Day macaron discount should be logged as in-kind sponsorship
- Design event follow-up opt-in process
- Research funding options for bat netting and upstairs doors
- Grants filter option
```

### 6. Update A Sidecar

Create or update a sidecar in the repo:

`sidecars/<promotion-slug>-<YYYY-MM-DD>.md`

Include:

- Source URL and target URL
- Baseline and head commits if code changed
- Visible UI diff before promotion
- Data tables promoted
- Rows added/updated with titles
- Columns omitted because of live schema drift
- Final production Chrome proof

### 7. Final Answer Shape

Be blunt:

- What was different
- What was promoted
- What was verified
- What remains not promoted, if anything

Never make the user infer from "pushed." Say whether production visually matches the sandbox target surface.

## Failure Checks

Before final answer, ask yourself:

- Did I compare the screenshot/browser UI, or only Git/database output?
- Did I inspect production after a hard reload?
- Did I prove the visible missing items are present?
- Did I accidentally compare the wrong table?
- Did I handle schema drift instead of failing silently?
- Did I separate dirty unrelated local work from the package?
- Would the user still see a difference if they put localhost and production side by side?

If any answer is weak, keep working.
