---
name: northstar-linear-to-sandbox
description: Use when translating Linear issues/projects into the North Star sandbox Development Dashboard before any sandbox-to-production promotion. Preserves the useful richness of Linear work briefs inside sandbox tasks, notes, comments, owners, labels, due dates, initiatives, and team pages without requiring anyone to read or know about Linear.
---

# North Star Linear To Sandbox

Use this skill to translate Linear's rich project-management layer back into the North Star sandbox dashboard.

This is not the production promotion workflow. After sandbox is updated and visually acceptable, use `sandbox-production-promotion` for Haley production.

## Default Targets

- Sandbox app: `http://localhost:4001/north-star-donors/`
- Sandbox Supabase mirror ref: `pasamzrwwaqhiwkixpbt`
- Production app: `https://northstarhouse.github.io/north-star-donors/`
- Live Supabase ref: `uvzwhhwzelaelfhfkvdb`
- Credentials: `$env:USERPROFILE\.claude\.env`

Use sandbox/mirror by default. Do not write live production in this skill.

## Core Rule

Linear may be the drafting/workbench layer. The sandbox dashboard is the shared team surface.

Do not make the dashboard depend on Linear links. People using the North Star app should be able to understand the task from the sandbox itself.

Use Linear issue briefs as source material, then rewrite them into clean dashboard-native notes/comments.

Dashboard notes and comments are for humans, not agents. Write them like a competent teammate updating another person who has not read Linear and does not care about internal IDs. Do not dump campaign IDs, activity IDs, API object names, raw verification logs, or tool-output prose into visible notes unless a specific ID is the actual next-action handle someone needs. Keep the precise IDs in Linear, sidecars, or comments only when they are genuinely useful.

## Required Read Before Any Write

1. Read the Linear project/issue.
2. Read sandbox tasks, initiatives, and comments from mirror Supabase.
3. Match by title, source task id, Linear URL, attachment URL, and domain terms.
4. Decide whether the Linear item maps to:
   - existing sandbox task
   - new sandbox task
   - existing initiative only
   - team page / focus update
   - no sandbox update
5. Preview the exact sandbox write package before mutating unless the user explicitly approved the exact operation.

## Sandbox Dashboard Shape

`tasks` supports:

- `title`
- `label`
- `status`
- `due_date`
- `notes`
- `attachment_url`
- `assigned_to`
- `initiative_id`
- `blocked_by`
- `archived_at`

`task_comments` supports:

- `task_id`
- `author`
- `content`
- `created_at`

`initiatives` supports:

- `title`
- `description`
- `owner`
- `started_at`
- `target_close_at`
- `status`
- `area`

`team_focus_entries` supports:

- `member`
- `section`
- `content`
- `completed`
- `due_date`

## Linear To Sandbox Mapping

- Linear project -> sandbox initiative.
- Linear issue -> sandbox task.
- Linear issue description -> sandbox notes after rewriting into a concise team-facing brief.
- Linear URL -> internal source only by default. Do not mention Linear in sandbox unless the user explicitly wants a breadcrumb.
- Linear labels -> one primary sandbox `label`.
- Linear assignee -> sandbox `assigned_to`.
- Linear due date -> sandbox `due_date`.
- Linear priority -> no native sandbox field; mention in comment only if important.
- Linear subissues -> separate sandbox tasks only if they are independently team-visible; otherwise fold the useful context into notes/comments.
- Linear blockers -> sandbox `blocked_by` only when blocker is another sandbox task.
- Linear attachments -> `attachment_url` only when there is one canonical team-facing artifact; otherwise summarize in notes/comments.

## Workflow Labels

Some Linear labels describe workflow state rather than the dashboard task type.

Do not map workflow labels such as `Needs input` into the primary sandbox `label`. Preserve the task's team-facing type label instead, then carry the workflow state into notes, blockers, or comments.

Example:

- Linear labels: `Technical`, `Needs input`
- Sandbox `label`: `Technical`
- Sandbox notes/comment: `Needs Haley input: confirm whether Haley owns IONOS/DKIM setup or wants Kaelen to take it over.`

Use this pattern for labels that mean blocked, waiting, needs review, needs input, meeting topic, or owner decision. The dashboard label should stay readable as the kind of work: `Decision`, `Research`, `Technical`, `Editing`, or `Other`.

## Preferred Labels

Use one primary dashboard label:

- `Decision`: open choice, approval, go/no-go, classification, owner/timing decision.
- `Research`: investigation before action.
- `Technical`: systems, credentials, data, email infrastructure, app behavior.
- `Editing`: copy/doc/draft refinement.
- `Other`: check-ins and operations that do not fit another label.

## Preferred Statuses

- `todo`: real next action exists but work has not started.
- `in_progress`: owner is actively working or review is underway.
- `done`: outcome reached and recorded.

Do not set `in_progress` just because the item is important.

## Dashboard Brief Pattern

For existing dashboard tasks that have a rich Linear brief, translate the useful detail into sandbox notes.

Preferred notes shape:

```text
Outcome:
...

Next:
...

Decisions / Questions:
- ...

Blockers:
...

Done when:
- ...

Context:
...

Sources:
- ...
```

Keep notes readable and team-facing. Remove internal process phrasing like "ported to Linear" unless the user explicitly requests a visible Linear breadcrumb.

Before writing notes, ask: "Would Haley or Kaelen understand this at a glance while using the dashboard?" If not, rewrite it. Prefer short sections, plain names, current state, next decision, and done criteria over semicolon-heavy technical inventories.

Use comments for short updates, provenance, or review notes that should not replace the task brief.

## New Sandbox Task Pattern

Only create a new sandbox task when no existing task captures the work and the task is team-visible.

Keep notes compact:

```text
Outcome:
...

Next:
...

Sources:
...
```

If the Linear description is long, compress it into this brief shape. Do not paste raw scratchpad text.

## Team Page / Focus Updates

When the user mentions a member page such as `/team/kaelen/`, check whether a `team_focus_entries` update is a better fit than a task note.

Use `team_focus_entries` for:

- current personal focus
- short reminders
- "what Kaelen should look at next"
- lightweight status context that is not a full dashboard task

Do not use team focus entries for rich acceptance criteria, blockers, or multi-step issue briefs. Those belong in task notes/comments.

## Verification

After sandbox writes:

1. Re-read mirror Supabase rows/comments that changed.
2. Verify the localhost dashboard list still looks compact.
3. Open task detail only when notes/comments might look bad or the user asks.
4. Report:
   - changed sandbox task ids/titles
   - notes/comments/team focus rows updated
   - what stayed internal only
   - whether this is ready for `sandbox-production-promotion`

## Handoff To Production

If the user wants live Haley production updated, stop using this skill and use `sandbox-production-promotion`.

That workflow must compare rendered sandbox vs production, promote approved mirror/live data deltas, and verify production after hard reload.
