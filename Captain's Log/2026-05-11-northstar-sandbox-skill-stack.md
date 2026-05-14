---
type: "captains-log"
date: "2026-05-11"
slug: "northstar-sandbox-skill-stack"
status: "complete"
created: "2026-05-11"
---

# Captain's Log: North Star Sandbox Skill Stack

> We converted a bad sandbox-to-production promotion into a durable workflow stack: sandbox verification, dashboard drilldown defaults, production-promotion guardrails, and CLI commands that prove localhost/mirror state before anyone claims production is done.

## Status & Purpose

This session followed a failed-feeling promotion pass where the sandbox and production dashboard were declared aligned too early. The visible mismatch was obvious in hindsight: localhost showed `To Do 10`, production showed `To Do 6`, and the missing rows lived in `tasks` / `initiatives`, not only `team_focus_entries`.

The purpose of this follow-up was to prevent that exact failure from recurring. The resulting stack separates four jobs:

- Start and verify sandbox/mirror.
- Triage dashboard work against the sandbox mirror by default.
- Promote approved sandbox changes into Haley production.
- Use CLI-Anything only for harness/source operations, not as a magical clone tool.

## What Got Done

- Patched `drilldown-development-dashboard` so sandbox mirror is the default DDD environment.
  - Default app: `http://localhost:4001/north-star-donors/`
  - Default Supabase ref: `pasamzrwwaqhiwkixpbt`
  - Live Supabase only when explicitly requested as production / Haley live / GitHub Pages / promote / push / merge.
- Created and validated `sandbox-production-promotion`.
  - Path: `C:\Users\ender\.codex\skills\sandbox-production-promotion\SKILL.md`
  - It forces rendered localhost-vs-production UI comparison first.
  - It forbids claiming success from Git state alone.
  - It requires hard-reloaded Chrome DevTools production proof before final.
- Extended the existing CLI-Anything North Star harness.
  - Harness path: `C:\Users\ender\.claude\projects\north-star-donors-gh\sandbox\north-star-donors\agent-harness`
  - Added `sandbox start`.
  - Added `sandbox verify`.
  - Added `sandbox diff-live`.
  - Added guarded `sandbox refresh-mirror` that intentionally refuses unsafe refreshes.
- Created and validated `northstar-sandbox`.
  - Path: `C:\Users\ender\.codex\skills\northstar-sandbox\SKILL.md`
  - It documents the operational commands and the limits of mirror/live comparison.
- Updated CLI harness docs and tests.
  - `pytest` result: `7 passed`.
  - Reinstalled editable harness with `pip install -e .`.

## Verification

`cli-anything-north-star-donors sandbox verify --json` passed:

- Root: `C:\Users\ender\.claude\projects\north-star-donors-gh\sandbox\north-star-donors`
- URL: `http://localhost:4001/north-star-donors/`
- `.env.local` Supabase ref: `pasamzrwwaqhiwkixpbt`
- `uses_mirror`: `true`
- `uses_live`: `false`
- `/north-star-donors/`: HTTP 200
- Page contains `Development Dashboard`
- `/north-star-donors/meetings`: HTTP 200

`cli-anything-north-star-donors sandbox diff-live --table initiatives --table tasks --table task_comments --table team_focus_entries --json` passed:

- `initiatives`: mirror 4, live 4, no row diff across common columns.
- `tasks`: mirror 17, live 17, no row diff across common columns.
- `task_comments`: mirror 6, live 6, no row diff.
- `team_focus_entries`: mirror 6, live 6, no row diff.

Known schema drift remained visible:

- Mirror-only `initiatives` columns: `description`, `owner`, `started_at`, `target_close_at`
- Mirror-only `tasks` columns: `blocked_by`, `domain`

## Decisions

- Sandbox/mirror is the default for DDD.
- Production/live must be explicitly requested.
- Git parity does not mean production parity.
- UI comparison comes before database diff when promoting sandbox to production.
- `refresh-mirror` must not silently overwrite mirror data until clone scope is defined.
- Current CLI harness can prove selected app-table parity and sandbox isolation; it cannot prove a perfect clone of Haley's whole master portal.

## What This Does Not Yet Solve

- Perfect Supabase clone.
- Storage bucket clone and verification.
- Auth/user clone and verification.
- RLS/policy clone and verification.
- Edge functions and secret parity.
- External integrations such as Resend, Constant Contact, IONOS, or Google Workspace.
- Automated safe destructive refresh of mirror from live.

## Current Skill Stack

- `$northstar-sandbox`
  - Start or verify localhost sandbox.
  - Confirm mirror Supabase.
  - Compare mirror/live dashboard tables.
- `$drilldown-development-dashboard`
  - Triage development dashboard tasks.
  - Defaults to sandbox mirror.
- `$sandbox-production-promotion`
  - Move approved sandbox changes to Haley production.
  - Requires rendered production proof.
- `$cli-anything`
  - Modify or extend the CLI harness itself.

## Next Moves

- Use `$northstar-sandbox` before future local dashboard work.
- Use `$drilldown-development-dashboard` after sandbox verification for task triage.
- Use `$sandbox-production-promotion` for approved localhost-to-production changes.
- Define the scope for a future safe `refresh-mirror` implementation before building it.

## Risks & Dependencies

- Future agents may still confuse mirror/live unless the relevant skill is invoked.
- Table-level diffs can look clean while storage, auth, policies, or functions differ.
- Parent repo remains dirty with unrelated email/volunteer/Supabase-client work; those edits are not part of the sandbox harness stack.
- `agent-harness/` is currently untracked inside the sandbox clone.

## Threads We Noticed

- The long-lapsed 11-person renewal task is not blocked by DKIM; DKIM belongs to the separate Dev Dashboard Resend / `info@` sending path.
- A safe mirror refresh workflow is probably worth its own drilldown.
- The new promotion skill should be used for every sandbox-to-Haley production push until it becomes muscle memory.
