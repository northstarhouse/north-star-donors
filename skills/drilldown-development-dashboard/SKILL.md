---
name: drilldown-development-dashboard
description: Focused drilldown workflow for North Star development-dashboard triage. Use when the user says DDD, triple D, drilldown development dashboard, asks to triage meeting-brief items against the Development Dashboard, or wants proposals worked through with GrillMe after checking existing To Do, In Progress, and Done tasks.
---

# Drilldown Development Dashboard

Use this as Drilldown plus a mandatory Development Dashboard reality check.

## Core Rule

Before suggesting, creating, changing, promoting, or dropping any task-like item, inspect the actual Development Dashboard state from the Supabase database first. Do not rely on the DOM as the source of truth except as a quick visual confirmation or when database access is blocked.

- To Do
- In Progress
- Done
- relevant initiative/plan sidebars visible in the app
- linked protected review documents when they define scope
- task attachments / linked documents when present
- relevant local sidecars and Captain's Logs when the task may have prior drilldown context
- relevant Vault sidecars / Captain's Logs when local evidence is thin or the task domain usually lives in Vault

Do this before GrillMe and again after a proposal changes.

After the user talks through a proposal, propose any needed task updates explicitly. The proposal must say whether to update an existing task, mark a task done, change owner/status/due date/labels, add a comment, or create no task at all.

During drilldown, accumulate proposed dashboard updates in the sidecar. Do not mutate dashboard data item-by-item while exploring. Rabbit holes may change or resolve proposed updates. Write to the live dashboard only at an explicit end gate, after reviewing the accumulated proposals with the user.

## Work Loop

Do not stop after routine progress updates. If the next step is clear, keep going.

Progress reports are not handoffs. After reporting that a baseline was read, a sidecar was updated, a task was classified, or a file was changed, immediately execute the next obvious DDD step unless a real blocker exists.

Only pause for the user when DDD actually needs one of these:

- a decision
- a credential, 2FA code, login, or external access
- approval before a risky or live dashboard mutation
- clarification where reasonable assumptions would fork the work
- confirmation at an explicit end gate

When pausing, make the ask explicit at the top:

```text
Need you:
Decision needed:
Approval needed:
```

If no explicit ask is present, the update is non-blocking and DDD should continue working.

When a turn ends, make the state obvious:

- If user input is required, start with `Need you:`, `Decision needed:`, or `Approval needed:` and ask exactly one concrete question.
- If no user input is required, do not phrase the update like a handoff. State the completed action and the next action DDD is taking or has already taken.
- Do not ask "what next?" when the sidecar, baseline, or source list already defines the next item.

## Tool Boundary

Supabase/database state is canonical for DDD. Use database access for the holistic task read, task comments, task notes, statuses, labels, owners, due dates, initiatives, and dashboard update proposals.

For North Star credentials, check `$env:USERPROFILE\.claude\.env` before using browser context or localStorage. The global env is the canonical local source for Supabase and related service credentials. Use those values in scripts and do not print secret values.

## Complete Issue Read

When the user points at one dashboard task, get completely apprised before judging, porting, splitting, or cleaning it up.

Required read path for the target task:

1. Read the task row from Supabase: title, status, label, owner, due date, notes, attachment URL, initiative, created/updated timestamps.
2. Read all comments for the task, not only the latest visible comment.
3. If `attachment_url` is present, open/read the attachment before summarizing the task. Do not treat an attachment URL as a source reference without reading its content unless access fails.
4. Search local `sidecars/` and `Captain's Log/` for the task title, initiative title, attachment slug, and distinctive terms from the task notes.
5. Run the Local Evidence Sweep below.
6. Only after those reads, summarize what the task is, what is missing, and what adjacent work exists.

If an attachment or local source cannot be read, say exactly which source is missing and lower confidence.

## Local Evidence Sweep

Before classifying, porting, splitting, cleaning up, or proposing updates for a dashboard task, search for existing local evidence in this order:

1. Current repo `sidecars/`.
2. Current repo `Captain's Log/`.
3. Vault `sidecars/`, `Captain's Log/`, and relevant notes only when:
   - current repo evidence is thin or missing
   - the task involves grants, provenance, research, transcript/meeting notes, strategy, GWS, email infrastructure, or other cross-repo North Star context
   - the dashboard row, notes, comments, attachment, or user explicitly points to Vault

Do not bulk-port Vault into the current repo by default.

If a Vault artifact is repeatedly useful for active donor-dashboard work, propose copying only that specific artifact into the current repo with a short provenance note. Do not copy secrets, bulky source material, raw audio, or unrelated agent scratchpad.

Report the sweep compactly:

```text
Local evidence:
- sidecars: found / not found
- Captain's Log: found / not found
- Vault: skipped / searched because ... / found ...
```

## Default Environment

Default DDD environment is the local sandbox backed by the mirror Supabase project.

- App URL: `http://localhost:4001/north-star-donors/`
- Supabase mirror ref: `pasamzrwwaqhiwkixpbt`
- Production URL: `https://northstarhouse.github.io/north-star-donors/`
- Live Supabase ref: `uvzwhhwzelaelfhfkvdb`

When the user is looking at localhost, says sandbox, staging, mirror, local drilldown, or does not specify an environment, bind DDD reads to the mirror Supabase values from `$env:USERPROFILE\.claude\.env`.

Use live Supabase only when the user explicitly says production, Haley's live site, GitHub Pages, live dashboard, or asks to promote/push/merge sandbox changes into production.

At the start of each DDD pass, state the bound environment in one line:

```text
DDD environment: sandbox mirror.
```

Do not mix mirror and live rows in one read without labeling both.

Use Chrome DevTools / browser inspection only for front-end visibility questions, such as:

- whether Haley's site visibly renders a field
- whether a comment, note, count, or label appears in the UI
- whether local browser cache is hiding fresh data
- screenshots / visual verification
- testing an actual browser interaction

Do not use DevTools as the first path for data that Supabase can provide. Do not use browser localStorage tokens as a routine workaround for DDD reads when direct Supabase/database access is available. If database access is blocked and browser context is the only route, state that limitation explicitly.

Run a holistic dashboard check at the start of the DDD session, not just a search for the one item under discussion. Know the whole visible work system before reasoning about a single proposal:

- all `todo` tasks
- all `in_progress` tasks
- all `done` tasks
- all task comments / note threads for every visible task
- task `id`
- task `title`
- task `label` such as `Technical`, `Decision`, `Research`, `Editing`, `Other`
- task `status`
- task `due_date`
- task `notes`
- task `attachment_url`
- task `assigned_to`
- task `initiative_id`
- joined initiative `id`, `title`, `area`, `status`, `created_at`, `updated_at`
- task `created_at`
- task `updated_at`
- task `archived_at` when present in the live query
- comment count
- full comments: comment `id`, `task_id`, `author`, `content`, `created_at`
- relevant overview documents
- relevant sidebar initiative counts

Do not call the read holistic until task comments have been read. A task row without its comments is incomplete dashboard state.

## Required Row Format

For each triaged claim, write:

```text
Brief says:
Dashboard says:
Possible task:
Validation question:
Handling:
```

Rules:

- `Brief says` quotes or paraphrases the source claim.
- `Dashboard says` names the exact existing dashboard task from Supabase, status, owner, due date, label, linked doc, or says `not found`.
- `Possible task` must be plain-language and concrete. If an existing task already covers it, write `none new`.
- `Validation question` asks the one question that decides whether the read is correct.
- `Handling` is one of `merge into existing`, `update existing`, `new task candidate`, `check-in candidate`, `research candidate`, `relationship/context`, `rabbit-hole candidate`, `context only`, `open question`, or `drop/noise`.

## Issue Micro-Brief Check

Before a dashboard task is ported to Linear, cleaned up for execution, or treated as ready for another agent, run it through this checklist:

- Outcome: what done means in one sentence.
- Owner: one accountable person or explicit owner gap.
- Next action: one concrete verb/object/location step.
- Blockers: concrete blockers or `none`.
- Source references: dashboard task, comments, attachments, sidecars, Captain's Logs, files, or links.
- Acceptance criteria: 2-5 testable bullets.
- Status / priority / due date: real metadata, including soft check-in dates when that is the honest target.
- Resume context: what has been done, what is next, and where to look.

For Linear ports, write the issue as a micro-brief, not a note dump. If a field is missing, ask or state the proposed default before creating/updating Linear.

## Dashboard Framing Ladder

Not every real signal is a task. Before proposing a dashboard update, choose the smallest honest frame the site can support.

Use `merge into existing` when:

- a current To Do / In Progress task already captures the action
- the new information only clarifies blocker, owner, due date, label, or scope
- adding a note/comment is less confusing than creating another card

Use `new task candidate` when:

- there is a concrete action
- the action has or needs a clear owner
- the work has a deadline, blocker, deliverable, or next meeting check-in
- the task title can be written without caveats like "maybe" or "possibly"

Use `check-in candidate` when:

- the work is not a full task yet, but the team should not lose track of whether something happened
- the point is to ask for status at the next meeting
- someone may be moving it forward, but ownership is not cleanly proven
- phrasing should be "Check whether..." or "Ask whether..." rather than "Do..."

Examples:

- `Check whether Empire Mine outreach is happening this week and keep the school-lunch idea attached as context.`
- `Ask whether the mid-summer event is officially deferred or still needs a go/no-go decision.`

Use `research candidate` when:

- the next honest action is exploration, not execution
- the value is in finding options, constraints, permission rules, or possible sources
- no one should act publicly until the research answer is known

Examples:

- `Research whether Mother's Day attendees can receive an event follow-up when emails exist but marketing permission is unclear.`
- `Research unusual/local/corporate/in-kind funding sources for bat-netting safety work and 12-door sponsorship.`

Use `relationship/context` when:

- the item is real but depends on trust, timing, or an existing relationship obligation
- forcing a task could create awkward or premature outreach
- the sidecar should preserve why now may not be the right time

Example:

- `Nisenan / Arts Council intro is real context, but Kaelen may need progress on the Arts Council cultural-asset mirror before opening a new North Star ask.`

Use `rabbit-hole candidate` when:

- the topic is real and probably important
- it requires its own source gathering, account access, technical investigation, or strategy session
- solving it would derail the current basic pass
- it should get a separate drilldown sidecar, with only the result summarized back into the canonical sidecar

Examples:

- `Arts Council fiscal sponsorship / Giona`
- `Google Ads, Facebook page, KVMR, signage, and broader community-exposure strategy`
- `IONOS / Resend / DKIM`

Use `context only` when:

- the item explains a decision but does not imply current work
- it is already done
- it is useful background for future discussion

Use `drop/noise` only when:

- the claim appears AI-invented, transcript-distorted, obsolete, or decorative
- no dashboard, transcript, linked doc, or user correction gives it practical weight

Do not use `drop/noise` for real but ownerless ideas. Park those as `context only`, `relationship/context`, `research candidate`, or `rabbit-hole candidate`.

## Available Dashboard Frames

When the website does not have a perfect "note-only" object type, adapt to the nearest existing dashboard affordance without pretending it is a normal task.

Known task fields/affordances to consider:

- title
- status: `To Do`, `In Progress`, `Done`
- label chips: `Technical`, `Decision`, `Research`, `Editing`, `Other`, and any live labels found in Supabase
- owner pill
- due date
- initiative chip
- area chip
- attachment/link
- comments
- notes

Preferred field choices:

- `Decision`: open choice, go/no-go, owner/sender/audience/timing decision
- `Research`: find options, permissions, grant sources, donor/context facts, feasibility
- `Technical`: systems, credentials, DNS, email infrastructure, app behavior
- `Editing`: copy/doc/draft refinement
- `Other`: check-ins, loose operations, or real items that do not fit another label

Preferred status choices:

- `To Do`: real next action exists but has not started
- `In Progress`: owner is actively working or active external dependency exists
- `Done`: completed and only retained as evidence/context

Do not put an item `In Progress` just because it is worth remembering. If it is only a memory hook, prefer:

- a `Research` task if investigation is needed
- a `Decision` task if the next step is a choice/check-in
- `Other` with a title that starts `Check whether...` if the dashboard must carry the reminder
- sidecar-only context if no team-facing reminder is useful

Title patterns:

- Action: `Post grant status update on the website`
- Research: `Research unusual grant sources for bat netting and 12-door sponsorship`
- Check-in: `Check whether Empire Mine outreach is happening this week`
- Decision: `Decide whether to defer the mid-summer magician event`
- Relationship/context: keep in sidecar unless there is a respectful, concrete next step
- Rabbit hole: create a separate drilldown, not a dashboard task, unless the user explicitly chooses to track it

When proposing a dashboard update for a non-task signal, state the frame explicitly:

```text
Frame:
Why this is not a normal task:
Best dashboard representation:
What not to imply:
```

## Dashboard-First Triage

1. Read the current dashboard tasks before proposing work.
2. Read task comments / note threads for those tasks.
3. Join comments back to their task titles before reasoning.
4. Use Supabase as the primary read path for dashboard tasks and comments. Read the DOM only as a preview/check, not as canonical data.
5. For target tasks, read attachments and relevant local sidecars / Captain's Logs before judging scope.
6. For each brief/transcript claim, search for an existing dashboard task or comment that already covers it.
7. Prefer mapping into existing tasks over creating new ones.
8. Treat `Done` as evidence that a claimed blocker may already be resolved.
9. Treat `In Progress` as evidence that the task exists; ask only whether status/details changed.
10. Treat `To Do` as queued work; do not duplicate it.
11. If the dashboard has a linked review document, inspect it before judging scope.

## Required Supabase Read Set

At the start of a DDD session, fetch at minimum:

- `tasks` with joined `initiatives(id,title,area,status,created_at,updated_at)`
- `task_comments` for all visible tasks, including `author`, `content`, and `created_at`
- initiative records / counts used by the dashboard
- strategic goal/sidebar records if they affect the visible dashboard
- attachment URLs for target tasks and any linked review documents they point to

If any of these cannot be read, say which source is missing and downgrade confidence. Do not proceed as if the dashboard was fully read.

Minimum task comment output to retain:

```text
Task:
Status / label / owner / due date:
Initiative / area:
Notes:
Attachment:
Latest comments:
Comment-derived blockers:
Comment-derived decisions:
```

Fields visible on the site that must be considered before proposing updates:

- task text/title
- status tab (`To Do`, `In Progress`, `Done`)
- label chips
- area chips
- initiative chips
- owner pills
- due date
- attachment indicator/link
- comment-count bubble
- expanded comments
- notes used by the task
- sidebar initiative counts
- overview links/cards

## After-Drill Reconciliation Gate

Trigger this gate whenever one drilled item, GrillMe branch, or proposal reaches a resting point. Examples: the user answers the validation question, corrects the premise, confirms a blocker, says "that makes sense", says "next", or the current item has enough information to classify.

Ask yourself before responding:

```text
Does what we just learned require a dashboard update?
```

Check every task variable that might need to change:

- `id` / exact target task
- `title`
- `label` such as `Technical`, `Decision`, `Research`, `Editing`, `Other`
- `status` / status tab (`todo`, `in_progress`, `done`)
- `due_date`
- `notes`
- `attachment_url`
- `assigned_to` / owner
- `initiative_id`
- joined initiative `id`
- joined initiative `title`
- joined initiative `area`
- joined initiative `status`
- joined initiative `created_at`
- joined initiative `updated_at`
- task `created_at`
- task `updated_at`
- `archived_at`
- comment count
- full comments / note thread
- comment `id`
- comment `task_id`
- comment `author`
- comment `content`
- comment `created_at`
- visible label chips
- visible area chips
- visible initiative chips
- visible owner pills
- visible due date display
- visible attachment indicator/link
- visible comment-count bubble
- expanded comments
- sidebar initiative counts
- overview links/cards
- dependency/blocker wording
- acceptance criteria / gates
- scope boundaries
- priority / order implied by due date or blocker status
- whether an existing task should absorb the finding
- whether a new task candidate is justified
- whether an old task is stale, duplicate, or already done
- whether a Done task needs no change but should be cited as evidence
- whether an In Progress task needs a note/status refinement
- whether a To Do task should remain queued but with clearer notes

Then record one of these proposed outcomes in the sidecar:

- no dashboard update
- add note/comment to existing task
- update existing task fields
- mark task done
- move task status
- assign/reassign task
- add/change due date
- change label/area/initiative
- split task
- merge into existing task
- create new task candidate
- archive/drop stale task

Do not silently skip this gate. If no update is needed, say so briefly and why. If an update is proposed, store it as a pending proposal, not a live dashboard write.

## Task Update Proposals

After discussion clarifies an item, propose exact dashboard updates in this format:

```text
Proposed dashboard update:
Task:
Change:
Reason:
Needs approval:
```

During the active DDD session, append these to the sidecar under:

```markdown
## Pending dashboard update proposals

| Task | Proposed change | Reason | Status |
|---|---|---|---|
```

Use `pending`, `superseded`, `approved for end gate`, or `dropped` for status.

Only execute approved updates during the end gate.

Allowed proposals:

- `no change`
- `update existing task`
- `mark done`
- `move status`
- `change owner`
- `change due date`
- `change labels/initiative`
- `add comment/note`
- `create new task candidate`

Prefer `add comment/note` when the work exists but needs clarified scope.
Prefer `no change` when the dashboard already represents reality.

## GrillMe Integration

Use GrillMe after the dashboard check, not before.

Ask one focused question at a time:

- "Does this existing task cover the brief claim?"
- "Is this blocker still active or already resolved?"
- "Should this context roll into an existing task, stay as research, or become a new task?"

Do not ask abstract questions without showing:

- what the brief says
- what the dashboard already says
- the exact task you are considering

## Sidecar

Use one sidecar markdown file for the session.

Keep dashboard triage separate from source evidence:

```markdown
## Dashboard cross-check

| Brief claim | Dashboard match | Status | Proposed handling | Validation question |
|---|---|---|---|---|
```

Do not update dashboard truth from sidecar notes until the user passes a gate.

## Source Authority

Use this order:

1. User correction in current conversation
2. Actual Development Dashboard task state
3. Linked protected review documents / Haley-facing app pages
4. Transcript evidence
5. AI-generated brief

Transcript evidence means something was said. It does not make it a task.

AI brief text is untrusted until checked against dashboard/source context.

## Handling Ideas

Do not kill useful ownerless ideas. Save them as `context/research`.

Only turn context into work when it attaches to:

- confirmed owner
- concrete artifact
- deadline
- blocker
- decision needed
- existing dashboard task

## Stop Conditions

Do not stop just because a DDD step finished. Continue to the next sidecar item, source claim, dashboard reconciliation, or rabbit-hole boundary.

Stop and ask exactly one labeled question only when:

- dashboard and brief conflict and the conflict cannot be resolved from Supabase, source documents, transcript, or current sidecar notes
- an item looks already done but changing status or wording would mutate live dashboard truth
- ownership is unclear and assigning the wrong person would create misleading work
- the proposed task would duplicate an existing dashboard task and the merge/drop choice affects the team-facing dashboard
- the user correction changes the classification and there is no conservative non-mutating way to record it
- credentials, 2FA, external account access, or a live dashboard write is required

If the next step is only reading, classifying, updating the sidecar, or drafting a pending proposal, do it without asking.
