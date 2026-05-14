---
name: northstar-sandbox
description: Use when starting, verifying, diagnosing, refreshing expectations for, or comparing the North Star localhost sandbox/mirror environment; runs the CLI-Anything sandbox commands, confirms mirror Supabase is used, checks localhost basePath health, and compares mirror/live dashboard tables when the user expects localhost to match Haley production.
---

# North Star Sandbox

Use this skill for operational sandbox work before North Star DDD, staging review, or sandbox-to-production promotion.

## Defaults

- Sandbox repo: `<repo-root>\sandbox\north-star-donors`
- Harness path: `<repo-root>\sandbox\north-star-donors\agent-harness`
- Sandbox URL: `http://localhost:4001/north-star-donors/`
- Base path: `/north-star-donors/`
- Mirror Supabase ref: `pasamzrwwaqhiwkixpbt`
- Live Supabase ref: `uvzwhhwzelaelfhfkvdb`
- Global credentials file: `$env:USERPROFILE\.claude\.env`

Do not use or announce `http://localhost:4001/` as the app URL. The app uses `basePath: /north-star-donors`.

Do not print secrets. Key names and Supabase refs are fine.

## Primary Commands

Use the installed CLI-Anything harness:

```powershell
cli-anything-north-star-donors sandbox start
cli-anything-north-star-donors sandbox verify --json
cli-anything-north-star-donors sandbox verify --diff-live --json
cli-anything-north-star-donors sandbox diff-live --table tasks --table initiatives --table task_comments --table team_focus_entries --json
```

If the console script is unavailable after a restart:

```powershell
cd <repo-root>\sandbox\north-star-donors\agent-harness
python -m pip install -e .
cli-anything-north-star-donors sandbox verify --json
```

## Start / Verify Workflow

1. Run `sandbox verify --json`.
2. If it fails because localhost is not responding, run `sandbox start`.
3. Re-run `sandbox verify --json`.
4. If the user asks whether localhost/sandbox has the same dashboard data as Haley production, or says "copy of Haley", "no diff", "same as production", "current mirror", or similar, immediately continue to **No-Diff Readiness Workflow** before answering.
5. Report only the facts that matter:
   - sandbox URL
   - mirror ref
   - whether live ref is absent
   - HTTP status for `/north-star-donors/`
   - whether `Development Dashboard` appears
   - whether `/north-star-donors/meetings` returns 200

Do not claim sandbox is ready unless verify passes.

## No-Diff Readiness Workflow

Use this workflow whenever the user expects `http://localhost:4001/north-star-donors/` to represent Haley production for dashboard triage.

1. Run:

```powershell
cli-anything-north-star-donors sandbox verify --diff-live --json
```

2. If the command returns usable diff data, report:
   - whether the app is using mirror Supabase, not live
   - whether the default dashboard tables have zero mirror/live differences
   - any mirror-only, live-only, or changed rows
3. If `verify --diff-live` is inconclusive, run the explicit table diff:

```powershell
cli-anything-north-star-donors sandbox diff-live --table tasks --table initiatives --table task_comments --table team_focus_entries --json
```

4. Only say "no diff" when those checked tables return zero row-count, row-presence, and common-column differences.
5. Say "no dashboard-table diff" or "no diff across checked dashboard tables"; do not say "literal full clone" or "no difference at all" unless a future harness proves code, database, storage, auth, policies, functions, and integrations all match.
6. If differences exist, do not continue with DDD as if the mirror is current. Report the differences and ask whether to refresh/rebuild the mirror or work against Haley production instead.

## Mirror / Live Diff Workflow

Use diff-live when the user asks whether sandbox data matches Haley production, whether a sandbox change is already promoted, or before/after production promotion.

Default dashboard tables:

- `initiatives`
- `tasks`
- `task_comments`
- `team_focus_entries`

Report:

- mirror/live row counts
- mirror-only rows
- live-only rows
- changed rows across live-compatible columns
- mirror-only columns caused by schema drift

Important: matching common columns is not a perfect clone proof. It does not prove storage buckets, auth settings, policies, edge functions, or external integrations match.

## Refresh-Mirror Boundary

The harness command exists but intentionally refuses:

```powershell
cli-anything-north-star-donors sandbox refresh-mirror
```

Do not work around that refusal. If the user says they want "no diff", first run the No-Diff Readiness Workflow. If diffs exist and `refresh-mirror` still refuses, state that the current harness cannot automatically force the mirror to match Haley production yet.

A safe mirror refresh must first define:

- schema migration direction
- destructive-write scope
- storage bucket policy
- auth/user handling
- RLS/policy handling
- edge function and secret handling
- external integration handling

If the user asks for a perfect clone, answer plainly: current tooling can verify selected app tables and sandbox isolation, but does not yet create a perfect clone of Haley's master portal. The honest target today is "no diff across checked dashboard tables" after `verify --diff-live` or `diff-live`.

## Relationship To Other Skills

- Use `drilldown-development-dashboard` after sandbox verify when triaging dashboard tasks. Its default environment is sandbox mirror.
- Use `sandbox-production-promotion` when moving approved sandbox changes into Haley production.
- Use `cli-anything` only when modifying or extending the harness itself.

## Failure Checks

Before saying sandbox is ready:

- Did I use `/north-star-donors/`, not `/`?
- Did `.env.local` point at `pasamzrwwaqhiwkixpbt`?
- Did verify prove `uses_live: false`?
- Did the app return HTTP 200?
- Did the page include `Development Dashboard`?
- If the user expected parity with Haley, did I run `verify --diff-live --json` or `diff-live`?
- Did I say "no diff across checked dashboard tables" instead of claiming a perfect clone?
