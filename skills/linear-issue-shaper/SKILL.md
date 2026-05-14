---
name: linear-issue-shaper
description: Shape rough work, donor dashboard tasks, notes, or backlog fragments into Linear-ready issues. Use when the user asks whether something is a good todo item, wants to port donor app/dashboard work into Linear, wants to get the shape of an issue, or needs a quick readiness check before creating or updating Linear.
---

# Linear Issue Shaper

Use this skill to decide whether a rough item is ready for Linear, what is missing, and what exact issue shape to propose.

Do not create or update Linear until the user approves the exact target, operation, and payload.

## First Move

If the item came from the North Star donor dashboard, use `drilldown-development-dashboard` first to read the real dashboard row, comments, initiative, owner, due date, notes, attachments, and relevant sidecars/Captain's Logs. Supabase/database state beats memory and browser appearance.

If the item came from conversation only, do not invent missing details. Ask one focused question if the missing field changes whether it belongs in Linear.

## Readiness Criteria

A good Linear issue has:

- Outcome: what changes when done.
- Next action: verb + object + location/context.
- Owner: one accountable person, or an explicit owner gap.
- Blocker/status: concrete blocker or current state.
- Done when: testable closure condition.
- Source: dashboard row, comment, sidecar, doc, meeting note, email, URL, or user statement.
- Scope boundary: what this issue is not trying to solve.
- Timing/priority: due date, check-in date, or why now matters.

If outcome + next action + blocker/status are missing, do not treat the item as Linear-ready.

## Classification

Classify each item before drafting:

- `ready to port`: enough fields exist to draft a useful issue.
- `needs one question`: one missing answer controls the issue shape.
- `research candidate`: next honest action is investigation.
- `check-in candidate`: someone should ask whether something happened.
- `dashboard cleanup`: Linear already has better/specific coverage.
- `context only`: useful background, not current work.
- `drop/noise`: obsolete, duplicated, or not practically actionable.

Prefer not to port vague dashboard rows. Clean or clarify them first.

## Output Format

For quick triage, answer:

```text
Item:
Classification:
Missing:
Suggested Linear shape:
Validation question:
```

For a Linear-ready item, draft:

```text
Title:
Project:
Labels:
Owner:
Priority:
Due/check-in:

Description:
Outcome:

Next:

Blockers:

Done when:
- ...

Context:

Sources:
- ...

Out of scope:
- ...
```

## Approval Gate

Before any Linear mutation, show:

```text
Target:
Operation:
Payload:
```

Then wait for explicit approval.

Use the official Linear plugin first. Use direct GraphQL only if the plugin lacks the operation or fails concretely, and only with a write guard.
