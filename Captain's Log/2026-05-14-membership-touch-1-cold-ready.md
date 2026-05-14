---
type: "captains-log"
date: "2026-05-14"
slug: "membership-touch-1-cold-ready"
status: "complete"
created: "2026-05-14"
---

# Captain's Log: Membership Touch 1 Cold Ready

> Cold Touch 1 was corrected after verifying that the "it has been a while" frame was false for this list, then proofed, approved, tracked in Linear, and promoted to the production dashboard as ready to send but not sent.

## Status & Purpose

The Cold Touch 1 email is part of the May to July 2026 membership email campaign. Its job is signal extraction and relationship repair, not a direct membership ask.

The original draft had a problem: it said, "It has been a while since you heard from us. Longer than it should have been." That sounded unnecessarily confessional, and it also needed fact-checking before use.

## What Got Done

- Verified the Cold Touch 1 Constant Contact draft exists.
- Verified it remains `DRAFT`.
- Verified it is attached to the Cold list with 36 sendable contacts.
- Verified there is no production send and no schedule.
- Changed sender/from and reply-to from `development@thenorthstarhouse.org` to `info@thenorthstarhouse.org`.
- Opened the local HTML preview for review.
- Checked Constant Contact contact activity for the Cold list.
- Found that all 36 Cold contacts had recent North Star email activity, including `The Star Newsletter` on May 13, 2026.
- Removed the misleading "it has been a while" opening.
- Replaced the opening with: `We are reaching out with appreciation for your past support of the North Star House, and with a brief update on what that support continues to make possible.`
- Changed the subject to `A brief update from the North Star House`.
- Changed the preheader to `With appreciation for your past support, here is what that support continues to make possible.`
- Sent a corrected one-person Constant Contact test to `endersclarity@gmail.com`.
- Verified the corrected test arrived in Gmail.
- Updated the local HTML preview to match the corrected draft and sender footer.
- Recorded the work in Linear issue `THE-14`.
- Marked `THE-14` done after copy approval.
- Ported the approved Cold readiness state into the sandbox dashboard.
- Promoted the sandbox dashboard update into production.
- Verified production after hard reload.

## Decisions

- The Cold email should not claim that recipients have not heard from North Star.
- The Cold email should remain no-ask.
- The real campaign stays unsent and unscheduled until there is a separate send decision and reply-monitoring plan.
- Dashboard notes should summarize the readiness state for humans, not dump Constant Contact ids or API output.
- Brick Buyers remains the only Touch 1 draft still needing the final sender, copy, audience, and proof pass.

## Next Moves

- Decide when Warm and Cold Touch 1 should actually send.
- Decide who watches `info@thenorthstarhouse.org` after those sends.
- Complete the Brick Buyers Touch 1 final pass.
- Keep dashboard and Linear aligned as each send moves from drafted to approved to sent.

## Risks & Dependencies

- The Cold send is approved as copy-ready, not approved as sent.
- Constant Contact test sends do not process dynamic contact fields, so `Dear Wyn` in the test does not prove real-list personalization. It only proves the draft/test-send path and visible copy.
- Gmail tab placement can vary. The corrected Cold proof landed in Updates rather than Promotions, but that should not be treated as a guarantee for the real list send.

## Evidence

- Linear issue: `THE-14`
- Production dashboard task: `Build Touch 1 draft campaigns in Constant Contact`
- Dashboard task id: `00ad353c-fd15-4457-8691-3c5668025966`
- Promotion sidecar: `sidecars/membership-cold-touch-1-dashboard-promotion-2026-05-14.md`
- Local HTML preview: `output/constant-contact-previews/cold-touch-1.html`

## Threads We Noticed

- Recent newsletter activity matters for copy claims. Future "cold" or "lapsed" language should be checked against Constant Contact activity before sending.
- The dashboard task is still `In Progress` because Brick Buyers is not finished.
- The next useful work is Brick Buyers Touch 1, not more Cold cleanup.
