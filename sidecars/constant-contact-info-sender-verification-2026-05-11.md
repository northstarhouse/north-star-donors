# Drilldown sidecar - Constant Contact info@ sender verification
Date: 2026-05-11
Parent task: Make `info@thenorthstarhouse.org` usable as Constant Contact sender/reply address for membership campaign
Session ceiling: Add/verify `info@thenorthstarhouse.org` in Constant Contact and confirm it can be used as from/reply-to, or identify the exact blocker.

## Open todos

* Confirm current sender state
  - `info@thenorthstarhouse.org` is a real mailbox.
  - `gws-info` is authenticated and token-valid for `info@thenorthstarhouse.org`.
  - The Resend invite for `info@` was accepted.
  - Constant Contact currently has no `info@thenorthstarhouse.org` account email, confirmed or unconfirmed.
  - Constant Contact confirmed account emails are `admin@thenorthstarhouse.org`, `development@thenorthstarhouse.org`, `media@thenorthstarhouse.org`, `wyn@thenorthstarhouse.org`, and `admin@thenorthstarhouse.ccsend.com`.
* Add or verify `info@` in Constant Contact
  - Context7 / official CC docs confirm `POST /v3/account/emails` with body `{"email_address":"info@thenorthstarhouse.org"}` adds the account email and sends a confirmation email.
  - Required scope/privilege: `account_update`.
  - Confirmed account emails can be used in `from_email` and `reply_to_email`.
  - Added `info@thenorthstarhouse.org` via CC API on 2026-05-11.
  - CC sent verification email to `info@`; found via `gws-info`.
  - Followed verification link. CC now reports `info@thenorthstarhouse.org` as `CONFIRMED`, email_id `11`, confirm_source_type `SITE_OWNER`.
* Confirm whether `info@` can be used as `from_email` and `reply_to_email` ✓
  - Context7 / official CC docs confirm `PUT /v3/emails/activities/{campaign_activity_id}` requires `from_email` and `reply_to_email` to be confirmed Constant Contact account email addresses.
  - Since CC now reports `info@thenorthstarhouse.org` as `CONFIRMED`, it is eligible for both fields.
  - No campaign was scheduled or sent during this drilldown.

## Notes / observations

- Keep this separate from the Dev Dashboard / Resend / IONOS DKIM work. That path affects Resend sends, not necessarily Constant Contact campaign sends.
- Prior CC audit says `from_email` and `reply_to_email` set on a campaign activity override the global default sender roles.
- Prior CC audit says `development@` and `media@` were confirmed by `SITE_OWNER`, suggesting logged-in CC account owner actions may confirm sender emails without an inbox click.
- `info@` does not currently hold global `DEFAULT_FROM` or `REPLY_TO` roles. That is not required for a campaign activity if the activity explicitly sets `from_email` and `reply_to_email`.

## Gate candidates

- Merge into existing dashboard task: `Confirm Constant Contact sender address` - `info@thenorthstarhouse.org` is now confirmed in Constant Contact and eligible as campaign from/reply-to.
- Merge into long-lapsed send task as a send-gate result - use `info@thenorthstarhouse.org` for Constant Contact from/reply-to if that remains the chosen campaign sender.
- Drop the prior blocker that `info@` was not a confirmed CC sender.
