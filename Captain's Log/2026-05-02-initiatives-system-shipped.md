---
type: "captains_log"
date: "2026-05-02"
slug: "initiatives-system-shipped"
status: "complete"
tags: [dashboard, initiatives, schema, ui, skills, system-architecture]
---

# Initiatives System Shipped — Schema, UI, Recategorization, Skill, Captainslog Wire

**TL;DR:** End-to-end shipped a parent-task ("Initiative") feature on the mirror dashboard in one session. Schema migration via Supabase Management API → UI baked into `app/page.tsx` and deployed to master-portal-fork.vercel.app → all 24 existing tasks recategorized under 2 initiatives (2026 Membership Renewal Campaign, Mirror Dashboard Build) → first-class `blocked_by` cross-task dependencies wired with 3 known blocker chains → new `/dashboard-tasks` skill registered as the operating contract for future task ops → `/captainslog` updated to be initiative-aware so future logs propose tasks with `initiative_id` and `blocked_by` set correctly. Ground truth for future agent sessions: the dashboard now organizes work by goal-with-progress-bar, not just a flat tag-filtered list.

---

## What got done

### 1. Schema migration (mirror Supabase only)
- New table `initiatives` with id/title/description/owner/started_at/target_close_at/status — status derived from children, not stored on the table
- `tasks.initiative_id` nullable FK ON DELETE SET NULL
- `tasks.blocked_by uuid[]` for first-class dependencies (replaces the BLOCKED-BY: notes-only convention as the queryable source of truth, while keeping the convention as human breadcrumb)
- `idx_tasks_initiative_id` btree + `idx_tasks_blocked_by_gin` GIN
- Applied via `https://api.supabase.com/v1/projects/{ref}/database/query` with PAT — bypasses needing Supabase CLI

### 2. UI implementation (~/code/north-star-donors/app/page.tsx, branch feat/donor-app-improvements)
- 3rd filter dropdown "Initiative" alongside Domain × Label
- Initiative card appears ONLY when an initiative is selected — shows progress bar (done/total), tag breakdown chips with counts (browse-by-tag, click to filter), Timeline with cards/Gantt toggle (Cards live; Gantt stubbed for next iteration)
- 4th task tab "⛔ Blocked" populated by `(t.blocked_by ?? []).length > 0`
- Inline ⛔ Blocked badge on every task with non-empty `blocked_by` (red border, hover for count)
- Tag chip click acts as additional label-OR-domain filter (browse-not-filter pattern)
- Build clean, deployed via manual `vercel --prod --yes`, verified live at master-portal-fork.vercel.app

### 3. Recategorization of all 25 existing tasks
- 22 → 2026 Membership Renewal Campaign (`fb7c750f-dc6a-4f9a-a86f-3d6f15c87f4c`)
- 3 → Mirror Dashboard Build (`1f02b5f9-005b-4d95-9c13-697e469f0c9d`)
- 1 → unassigned (Historic Blog Posting `8f0d1e1b` — no clean initiative fit, NULL is valid)
- 1 NEW task created: DKIM rollout `775e459e` — surfaces a real piece of work that was previously only a notes convention
- 3 blocker chains wired in `blocked_by` array:
  - `64e52fd4` Send to 11 ← blocked by `775e459e` DKIM rollout
  - `5a93ccbd` Derive Current Donors ← blocked by `1ca92a79` Haley check-in
  - `775e459e` DKIM rollout ← blocked by `1ca92a79` Haley check-in (DNS access holder unknown)
- Per-batch user approval (per `feedback_vet_db_entries` HARD RULE), no autonomous DB writes

### 4. `/dashboard-tasks` skill registered (`~/.claude/skills/dashboard-tasks/SKILL.md`)
- Full schema reference (initiatives + tasks columns)
- PostgREST cookbook (with the UUID `eq` not `like` gotcha called out)
- Conventions: notes formatting, BLOCKED-BY/BLOCKS/RELATES-TO breadcrumb, status-not-in-notes rule
- HARD RULES: no autonomous writes, holistic-read on changes, mirror-not-prod
- Workflow patterns for "Add task X", "Mark X done", "What's on dashboard", "Block X on Y", "Create initiative"
- Current state snapshot (initiatives + counts + blocker chains) — to be updated whenever schema changes

### 5. Captainslog awareness wire-in (`~/.claude/skills/captainslog/SKILL.md` Step 5)
- Task proposal now REQUIRES Initiative resolution before drafting (pull live initiatives, match by topic, flag null fits)
- `blocked_by` field added to proposal schema with cross-reference instructions
- Insertion mechanics extended to include `initiative_id` and `blocked_by uuid[]` columns
- Holistic-read pattern: when marking a task done, query for tasks where `<this-id> = ANY(blocked_by)` to surface potentially-now-unblocked tasks

## Why

Kaelen articulated a real pain point: dashboard tasks were fragmenting under no parent goal, and tag-based discovery requires perfect tagging discipline. The end-state vision: "you'd just go to the development dashboard and see that item, where we're at, what's being done, who owns what, and when it's expected to be done."

Three sketches on here.now (radiant-realm-gfh4.here.now) walked through the design space:
- v1 had bespoke phases (Setup/Lists/Auth/Send/Follow-up) — Kaelen rejected as too campaign-specific
- v2 swapped phases for auto-tag breakdowns + timeline (cards + Gantt toggle) + first-class blockers — directionally right
- v3 moved blockers out of hero into a dedicated 4th tab (Kaelen's call), replaced cut-off annotations with hover-tooltip ⓘ markers — locked

Then: "Bake it into our mirror" — full implementation in one session.

## What got decided

- **Schema is intentionally lean:** initiatives table has no derived fields (no progress %, no done_count) — UI computes them from children. Keeps the table simple, no triggers needed.
- **`tasks.initiative_id` nullable not required.** Some tasks (like Historic Blog Posting) genuinely don't fit a campaign — NULL is a valid first-class state.
- **`blocked_by` is uuid[] not a join table.** Lighter weight, fits PostgREST queries via GIN index. Tradeoff: can't add metadata to a dependency edge (no "soft blocker" vs "hard blocker") — accepted, can revisit.
- **No "phases" concept.** v1 had it, killed in v2 because too campaign-specific. Tag breakdowns + due-date timeline cover the same need without bespoke taxonomy per initiative.
- **Per-task DB write approval ALWAYS, even in autonomous mode.** Reaffirmed `feedback_vet_db_entries`. The 24-row recategorization batch was approved as a batch only after the proposal table was shown.
- **Both notes BLOCKED-BY: convention AND `blocked_by[]` column** — the array is the queryable truth (drives the Blocked tab and unblock-detection); the notes line is the human breadcrumb.

## What's stuck / open

- **Gantt timeline view** — UI stub says "coming next iteration. For now use Cards." Will implement when more tasks have real due_dates.
- **Initiative status auto-transition** — when all child tasks `done`, no automatic prompt to flip the initiative to `completed`. Manual for now.
- **Blocker UI in expanded task view** — currently only inline ⛔ badge + Blocked tab. Click-through to the BLOCKING task isn't wired (would resolve `blocked_by[0]` to a task and link). Future iteration.
- **`/dashboard-tasks` skill is v1** — written from this session's understanding, not battle-tested. Will discover edge cases on next few real usages.
- **No initiative templates yet** — when creating a new "Campaign"-type initiative, no starter set of suggested tasks. Could be a future enhancement.
- **Multi-initiative tasks** — current schema is one task → one initiative. If a task genuinely serves two initiatives, you have to pick one. Could move to a join table later if this becomes a real pattern.

## Surprises

- **Supabase Management API for migration** worked first try via `https://api.supabase.com/v1/projects/{ref}/database/query` with the PAT. Way faster than CLI dance; bypasses the need to install supabase-cli locally and configure project linking.
- **PostgREST UUID `like` operator failure** bit again — `id=like.05da9d58*` returns 404 with `operator does not exist: uuid ~~ unknown`. Required pre-fetching full UUIDs via `&select=id` and using `id=eq.<full-uuid>`. This is in memory `feedback_postgrest_uuid_no_like` but I forgot mid-loop and had to re-discover. Worth re-reading next time.
- **Tab type `'blocked' as TaskStatus` cast** — the Blocked tab isn't a real status, it's a view over `blocked_by[]`. The hacky cast `taskTab === 'blocked' as TaskStatus` works but is type-system-abuse. Worth a follow-up cleanup (define a separate `TaskTab = TaskStatus | 'blocked'` type).
- **Captainslog SKILL.md was ALREADY > 280 lines** with a robust per-task-approval block. Wire-in for initiatives took only 2 small edits (Step 5 task fields + insertion mechanics). The skill is mature.

## Why this is its own captain's log

Different facet from the two earlier 2026-05-02 logs:
- `branch-fuckery-and-vercel-deploy-audit` = process postmortem, internal infra
- `cc-campaign-readiness-and-system-gaps` = forward-looking outreach state + system gaps captured-not-built
- THIS log = system gaps now SHIPPED. Architecture + tooling.

These will read very differently in 6 months when something breaks or someone wants to know "when did Initiatives land?"

## Companion artifacts

- here.now sketch v3 (frozen design reference): https://radiant-realm-gfh4.here.now/
- Schema reference: `~/.claude/skills/dashboard-tasks/SKILL.md`
- Captainslog wire: `~/.claude/skills/captainslog/SKILL.md` Step 5
- UI source: `~/code/north-star-donors/app/page.tsx` (branch `feat/donor-app-improvements`)
- Live URL: https://master-portal-fork.vercel.app/

## What's next (this session pivot)

Kaelen's call: "pivot back to actually updating and discussing those, where to proceed, how to proceed with the whole constant contact campaign... let me brain dump on the to-do list."

Next move: walk through Membership Renewal initiative tasks one-by-one. Brain dumps + status updates → captured into a 4th captain's log when done.
