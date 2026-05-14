# Drilldown sidecar - Long-lapsed email-only renewal
Date: 2026-05-11
Parent task: Send Long-Lapsed Email-Only Renewal to 11 recipients
Session ceiling: Get the task unblocked enough to send or identify the one real blocker.

## Open todos

* Confirm current dashboard state
  - DDD environment: sandbox mirror.
  - Task id: `82925293-a4eb-49d2-8f6e-ebe854a3e3a7`
  - Status: `in_progress`
  - Owner: `Kaelen`
  - Due: `2026-05-11`
  - Initiative: `Recently Lapsed Member Letter`
  - Label: `Other`
  - Comments: none
* Resolve send gates
  - Spot-check recipient name matches.
  - Confirm sender/reply address.
  - Get Haley comfortable before sending.
  - User decision 2026-05-11: leave Jean McKeen off this send for now because her CC permission is `pending_confirmation` and the safe path is to exclude her until clarified.
* Locate source files / recipient evidence
  - Dashboard notes name recipient list: `Membership Drive/lists-csv/long-lapsed-undeliverable-email-recovered-2026-05-02.csv`
  - Dashboard notes name HTML: `Membership Drive/email-drafts-2026-05-02/Long-Lapsed-Email-Only-Renewal.html`
  - Initial local scan did not find those paths in this repo or sandbox clone.
  - Vault Captain's Logs are now copied into this repo.
  - `2026-05-02-unreachable-donor-email-recovery-cc-oauth.md` confirms the original 11 names: Barbara Miller, Brittney Armacher, Jean McKeen, Richard Pemberton, Katherine Stiles, Emily Arbaugh, Louise Beesley, Mimi Simmons, Kathleen Smith, Susan Purdy, Diann Patton.
  - `2026-05-03-list-files-renamed-and-task-refs-updated.md` says `Long-Lapsed-Email-Only-2026-05-02.csv` was renamed to `long-lapsed-undeliverable-email-recovered-2026-05-02.csv`.
  - Current Vault `Membership Drive/lists-csv/` does not contain that renamed CSV; it only has leftover-donor and no-email cohort CSVs.
  - Current Vault initially did not contain `Membership Drive/email-drafts-2026-05-02/`; the email-adapted HTML was referenced in logs but not present on disk.
  - Supabase mirror Storage check found the missing HTML in bucket `email-assets`, path `2026-05-02/Long-Lapsed-Email-Only-Renewal.html`, size 5,611 bytes.
  - Recovered local file to `C:\Users\ender\.claude\projects\Vault\Membership Drive\email-drafts-2026-05-02\Long-Lapsed-Email-Only-Renewal.html`; SHA256 `4F5F16E7762A866511601396E92377B5B4EBC7F8298421DF248BFF4F6F64368B`.
  - Constant Contact API read-only lookup was unblocked on 2026-05-11 after fresh OAuth.
  - Constant Contact contact scan checked 2,383 contacts.
  - All 11 named recipients were found by name in Constant Contact.
  - One duplicate Constant Contact record exists for Diann Patton; one record has current list memberships and one older record has no list memberships.
  - Jean McKeen is present but has `pending_confirmation` permission rather than `implicit`.
  - The other named recipients found in the scan have `implicit` permission.

## DDD row

Brief says:
The selected task is `Send Long-Lapsed Email-Only Renewal to 11 recipients`.

Dashboard says:
Task exists in sandbox mirror, is `in_progress`, owner `Kaelen`, due `2026-05-11`, initiative `Recently Lapsed Member Letter`. Notes say this is Touch 1 for 11 long-lapsed donors whose physical letters were undeliverable but whose emails were recovered through Constant Contact.

Possible task:
none new

Validation question:
Where are the named CSV and HTML draft files now: local repo, vault folder, Google Drive, or Constant Contact?

Handling:
merge into existing

## Notes / observations

- DKIM is not treated as a blocker for this small 11-person send.
- The DKIM/IONOS/Resend issue belongs to `Making info@ able to send emails through Dev Dashboard`, not this renewal task.
- Current real gates are content/list verification, Jean McKeen permission handling, duplicate Diann Patton handling, and sender/reply comfort.
- Jean McKeen permission handling is resolved for this pass: exclude her for now.
- Constant Contact confirmed account emails checked 2026-05-11. Initial check showed `info@thenorthstarhouse.org` was missing. Separate drilldown added and verified `info@`; CC now reports it as `CONFIRMED` and eligible for `from_email` / `reply_to_email`.
- Existing campaign docs say Kenneth Underwood is the intended voice, but sender address was still pending Haley input. `campaign-plan.html` explicitly asks whether sends should come from `development@`, a new house-voice address, or another known address.
- Reconstructing the send package may be possible from logs + Constant Contact contact evidence. The original HTML draft has now been recovered from mirror Supabase Storage; the original renamed recipient CSV is still missing on disk.
- Updated sandbox mirror task notes on 2026-05-11 with a `Recent developments` block covering copied Captain's Logs, confirmed 11 names, missing files, CC token blockage, and the clarified non-DKIM blocker.
- CC token blockage has since been resolved; the sandbox task notes are stale on that point and should be updated at the DDD end gate.

## Constant Contact read-only findings - 2026-05-11

Names found:

- Barbara Miller - found, `implicit`
- Brittney Armacher - found, `implicit`
- Jean McKeen - found, `pending_confirmation`
- Richard Pemberton - found, `implicit`
- Katherine Stiles - found, `implicit`
- Emily Arbaugh - found, `implicit`
- Louise Beesley - found, `implicit`
- Mimi Simmons - found, `implicit`
- Kathleen Smith - found, `implicit`
- Susan Purdy - found, `implicit`
- Diann Patton - found twice; current list-member record is `implicit`, older no-list record also exists

Do not paste full recipient emails into chat. If an export is needed, generate a local artifact and treat it as donor PII.

## Gate candidates

- Merge: add a task comment with verified source-file location and send readiness once found.
- Update existing: mark done only after send is confirmed.
- Promote: separate source-location cleanup if files live outside repo and need a durable link.

## Paused resume point - 2026-05-11 night

User called it for bedtime. Do not create the Constant Contact draft until the next session.

Current state:

- Constant Contact API access is restored.
- `info@thenorthstarhouse.org` is confirmed in Constant Contact and can be used explicitly as `from_email` / `reply_to_email`.
- `admin@thenorthstarhouse.org` remains the account-level `DEFAULT_FROM` / `REPLY_TO`; this does not block explicit campaign activity sender fields.
- Long-lapsed renewal HTML was recovered from mirror Supabase Storage and saved locally:
  - `C:\Users\ender\.claude\projects\Vault\Membership Drive\email-drafts-2026-05-02\Long-Lapsed-Email-Only-Renewal.html`
- Recipient direction is now 10 people, not 11:
  - exclude Jean McKeen for this pass because CC permission is `pending_confirmation`
  - use the current Diann Patton list-member/contact record, not the older no-list duplicate
- DKIM / Resend / Dev Dashboard is not a blocker for this Constant Contact send.
- Original renamed recipient CSV is still missing locally, but recipient evidence is recoverable from Constant Contact.

Next concrete step:

1. Build a Constant Contact draft only.
2. Campaign name: `DRAFT - Long-Lapsed Email-Only Renewal - 10 recipients - 2026-05-11`.
3. Create/find a CC list for the 10 approved contacts.
4. Add the 10 matched CC contacts to the list.
5. Create email campaign draft and update the activity with recovered HTML, subject, `info@` from/reply, and list id.
6. Read the activity back with `include=html_content`.
7. Save a local build report with campaign id, activity id, list id, recipient count, excluded Jean note, and no-send/no-schedule proof.
8. Stop. Do not call schedule/send endpoints without explicit approval.

## Pending dashboard update proposals

| Task | Proposed change | Reason | Status |
|---|---|---|---|
| Send Long-Lapsed Email-Only Renewal to 11 recipients | Add note/comment: CC API access restored; all 11 names found in Constant Contact; Jean McKeen has `pending_confirmation`; Diann Patton has a duplicate older record; original HTML recovered from mirror Supabase Storage; original recipient CSV still not found; DKIM not blocker. | Task notes currently say CC lookup is blocked and HTML is missing; that is now stale. The team-facing blocker should move to final recipient/source and send-review gates. | pending |
| Send Long-Lapsed Email-Only Renewal to 11 recipients | Add note/comment: for this pass, exclude Jean McKeen because CC permission is `pending_confirmation`; `info@thenorthstarhouse.org` is now confirmed in Constant Contact and can be used as from/reply-to if that remains the chosen campaign sender. | Captures the user’s safe-send decision and updated sender readiness. | pending |
| Send Long-Lapsed Email-Only Renewal to 11 recipients | Add note/comment: paused for bedtime before CC draft creation. Next step is draft-only build for 10 recipients using recovered HTML and `info@` from/reply; no schedule/send without explicit approval. | Creates clean resume point for tomorrow. | applied to sandbox notes 2026-05-11 |
