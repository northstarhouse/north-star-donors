---
type: "captains-log"
date: "2026-05-14"
slug: "membership-touch-1-warm-ready"
status: "complete"
created: "2026-05-14"
---

# Captain's Log: Membership Touch 1 Warm Ready

> Warm Touch 1 for the 2026 membership email campaign was built, corrected, proofed, and tracked as ready to send, while staying explicitly unsent and unscheduled.

## Status & Purpose

The work centered on getting the Warm Touch 1 membership email from rough campaign context into a verified operational state. The goal was not to fire the email. The goal was to know what existed, who it would go to, whether the copy and sender were correct, and whether the dashboard and Linear reflected reality instead of stale task fragments.

This sits inside the May to July 2026 membership email campaign. Warm Touch 1 is the first send to recent or near-recent donors.

## What Got Done

- Confirmed the Warm Touch 1 Constant Contact campaign exists as a draft.
- Confirmed it is attached to the Warm membership list with 85 sendable contacts.
- Confirmed the real Warm campaign remains unsent and unscheduled.
- Changed the CTA from `Make My Membership Gift` to `Make a Membership Gift`.
- Changed sender/from and reply-to to `info@thenorthstarhouse.org`.
- Confirmed the saved greeting token uses first name with fallback to `Friend`.
- Sent a one-person proof campaign to Kaelen only.
- Verified the proof email rendered `Dear Kaelen,` and used the corrected CTA.
- Checked Gmail Promotions placement and decided it was normal Constant Contact list-mail behavior, not a blocker.
- Updated Linear with the readiness state, verification evidence, and the decision that Warm Touch 1 is ready to send but has not been sent.
- Updated the sandbox Development Dashboard task with readable notes and a readiness comment.
- Promoted that dashboard task update to production.
- Verified production after hard reload: the task moved to `In Progress`, the Membership Email Campaign counts updated, and the cleaned notes/comment rendered on the production task detail page.

## Decisions

- Warm Touch 1 is safe to send when the actual send decision is made.
- Do not over-optimize Gmail tab placement.
- Do not schedule or send until there is clear approval and a reply-monitoring plan.
- Dashboard notes should be human-readable. Raw campaign ids and tool dumps belong in sidecars or technical evidence, not visible task notes.
- The dashboard remains self-contained; someone should be able to understand the task without reading Linear.

## Next Moves

- Decide when Warm Touch 1 should actually send.
- Decide who is watching `info@thenorthstarhouse.org` after the send.
- Repeat the final sender, copy, audience, and proof checks for Cold Touch 1.
- Repeat the final sender, copy, audience, and proof checks for Brick Buyers Touch 1.
- Keep Linear and the dashboard aligned as work moves.

## Risks & Dependencies

- The real send still depends on human approval and reply coverage.
- Cold and Brick Buyers are drafted, but they have not received the same final proof pass documented here for Warm.
- Constant Contact suppresses unsubscribed contacts automatically; those people should not be manually re-added unless they explicitly ask to rejoin.
- Promotions placement can still happen because this is list email from Constant Contact. That is acceptable unless deliverability evidence changes.

## Evidence

- Production task: `Build Touch 1 draft campaigns in Constant Contact`
- Production task id: `00ad353c-fd15-4457-8691-3c5668025966`
- Promotion sidecar: `sidecars/membership-touch-1-draft-task-promotion-2026-05-14.md`
- Production URL: `https://northstarhouse.github.io/north-star-donors/`
- Sandbox URL used for review: `http://localhost:5173/north-star-donors/`

## Threads We Noticed

- The next useful campaign work is Cold or Brick Buyers final review, not more dashboard cleanup.
- The `northstar-linear-to-sandbox` skill now carries the human-readable note convention for future ports.
- Linear is useful for work discipline, but production dashboard notes still need to stand on their own.
