---
type: "captains-log"
date: "2026-05-11"
slug: "constant-contact-info-nsh-added-and-verified"
status: "partial"
created: "2026-05-11"
---

# constant-contact-info-nsh-added-and-verified

> `info@thenorthstarhouse.org` was added to Constant Contact, verified through the real mailbox, and cleared for use as a campaign sender/reply-to address.

## Status & Purpose

What got done:
- `info@thenorthstarhouse.org` was added to the Constant Contact account email list.
- The Constant Contact verification email was received in the real `info@thenorthstarhouse.org` mailbox through the `gws-info` profile.
- The verification link was followed.
- Constant Contact now reports `info@thenorthstarhouse.org` as `CONFIRMED`.
- The long-lapsed sidecar was updated to remove the stale blocker that `info@` was not a verified Constant Contact sender.

Why:
- The long-lapsed renewal campaign needed a clean sender/reply-to address.
- The working assumption was that Haley had already set up `info@`, but Constant Contact did not yet have it confirmed.

Purpose:
- Clear the sender-address blocker without treating DKIM/Resend as a blocker for this Constant Contact send.
- Make `info@thenorthstarhouse.org` eligible for campaign activity `from_email` and `reply_to_email`.

Connected goal:
- Resume the long-lapsed email-only renewal sidecar with the correct sender identity.
