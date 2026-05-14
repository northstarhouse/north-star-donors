# Drilldown sidecar - Constant Contact auth and draft UI access
Date: 2026-05-12
Parent task: Open the Constant Contact draft campaign in the browser UI without losing the auth breadcrumbs.
Session ceiling: Preserve the auth path and reach the draft editor if possible; do not schedule or send anything.

## Open todos

* Get through Constant Contact browser login
  - Constant Contact UI login username is `nshc1905`, from `CC_LOGIN_USERNAME`.
  - Important: the Constant Contact login username is not `admin@thenorthstarhouse.org`; using the email address as the username fails.
  - Password is stored in `C:\Users\ender\.claude\.env` as `CC_LOGIN_PASSWORD`.
  - Do not print or paste the password into chat.
  - Browser login accepted username/password and redirected to MFA.
  - MFA page says a verification code was sent to a masked address ending in `n@thenorthstarhouse.org`.
  - Constant Contact account summary says contact email is `admin@thenorthstarhouse.org`.
  - User confirmed Haley is still logged into `admin@thenorthstarhouse.org` in Gmail and texted the MFA code to the user.
  - Regular Chrome failure is likely from using the email address instead of username `nshc1905`, or from not using the saved `CC_LOGIN_PASSWORD`.
  - Likely next step: retrieve the MFA code from `admin@thenorthstarhouse.org`, then enter it into the MFA form.

* Keep draft-only guardrails visible
  - Campaign draft already created through Constant Contact API.
  - Campaign ID: `68337adf-6162-44ee-9858-4e2e45f130bb`.
  - Activity ID: `fc2a1977-8435-494b-9bbd-4901d0f37946`.
  - Campaign status readback: `Draft`.
  - 10-recipient list attached.
  - HTML readback succeeded.
  - No schedule/send endpoint was called.
  - Do not click schedule/send controls in the browser without explicit approval.

* Open the draft editor after auth
  - Direct API-guessed editor URL `https://app.constantcontact.com/pages/campaigns/email-details/edit/fc2a1977-8435-494b-9bbd-4901d0f37946` returned "This page does not exist" in the Constant Contact UI.
  - Direct API-guessed campaign details URL `https://app.constantcontact.com/pages/campaigns/email-details/details/68337adf-6162-44ee-9858-4e2e45f130bb` also returned "This page does not exist".
  - Correct UI editor link discovered from Campaigns list: `https://app.constantcontact.com/pages/ace/v1/fc2a1977-8435-494b-9bbd-4901d0f37946`.
  - Login redirect URL currently points back to that editor URL.
  - If editor URL fails after MFA, try campaign details URL: `https://app.constantcontact.com/pages/campaigns/email-details/details/68337adf-6162-44ee-9858-4e2e45f130bb`
  - If both fail, use campaigns index: `https://app.constantcontact.com/pages/campaigns` and search for `DRAFT - Long-Lapsed Email-Only Renewal - 10 recipients - 2026-05-11`.
  - Clicking `Continue` from the custom code editor opened schedule/setup route: `https://app.constantcontact.com/pages/campaigns/view/schedule/campaignId/68337adf-6162-44ee-9858-4e2e45f130bb`.
  - Schedule/setup page shows the selected audience under `Audience`: list `DRAFT - Long-Lapsed Email-Only Renewal - 10 recipients - 2026-05-11`.
  - UI text confirms `1 list selected | 10 unique recipients`.
  - The page exposes `Send now`; do not click without explicit send approval.
  - User requested a test send to `endersclarity@gmail.com`.
  - Applied 2026-05-12 via `POST /v3/emails/activities/fc2a1977-8435-494b-9bbd-4901d0f37946/tests`; Constant Contact returned HTTP `204`.
  - This was a test send only; no audience send, schedule, or campaign-list send was performed.
  - Caveat: Constant Contact docs indicate test sends/previews may not prove live personalization merge behavior.
  - User received the test email and it said `Dear Wyn`.
  - Official Constant Contact custom-code docs explain that the HTML preview method uses account owner contact information to populate personalization tags.
  - API readback after account contact-email change still shows account summary first name `Wyn`, last name `Spiller`, contact email `info@thenorthstarhouse.org`.
  - Interpretation: `Dear Wyn` is preview/test-send account-profile substitution, not evidence that every live recipient will be addressed as Wyn.
  - User requested treating `endersclarity@gmail.com` as an 11th proof recipient to prove live personalization.
  - Created/updated contact `endersclarity@gmail.com` as `Kaelen Jennings`; contact ID `4df5260c-d527-11f0-bb9b-0242e0fdda71`.
  - Created one-person proof list `TEST - Kaelen personalization proof - 2026-05-12`; list ID `0de1144c-4db1-11f1-b491-02420a320002`.
  - Created separate proof campaign `TEST - Long-Lapsed Personalization Proof - Kaelen - 2026-05-12`; campaign ID `f31a4ba3-eec0-44d6-ac99-5ef7fb0d0930`, activity ID `fbc98105-ceb7-4a4d-b4d6-b55828a23351`.
  - Used official custom-code token syntax `[[FIRSTNAME OR "Friend"]]` in the proof copy.
  - Scheduled/sent only the one-person proof copy at `2026-05-12T03:17:36Z`.
  - Original 10-recipient long-lapsed draft was not sent or scheduled.

## Notes / observations

- Constant Contact API auth is working through tokens in the global env file.
- Browser UI auth is separate from API auth and requires username/password plus MFA.
- Campaign rows do not show recipient email addresses directly. For the long-lapsed draft, the recipients are visible through Audience > Lists and segments > `DRAFT - Long-Lapsed Email-Only Renewal - 10 recipients - 2026-05-11`.
- Direct list UI URL: `https://app.constantcontact.com/contacts/lists/c87ac5fc-4daa-11f1-98a3-02420a320003`.
- This list view shows `All list contacts` count `10` and displays the contact table with name, email address, first name, last name, email status, source, and date added.
- Confirmed list rows include the intended ten long-lapsed recipients; no send/schedule action was performed during this recipient-list inspection.
- Preflight readback 2026-05-12:
  - Campaign `68337adf-6162-44ee-9858-4e2e45f130bb` is still `DRAFT`.
  - Activity `fc2a1977-8435-494b-9bbd-4901d0f37946` is still `DRAFT`.
  - Activity is attached to exactly one contact list: `c87ac5fc-4daa-11f1-98a3-02420a320003`.
  - That list returned 10 contacts.
  - Jean McKeen was not present in the attached list.
  - Recipients by name: Barbara Miller; Brittney Armacher; Diann Patton; Emily Arbaugh; Katherine Stiles; Kathleen Smith; Louise Beesley; Mimi Simmons; Richard Pemberton; Susan Purdy.
  - From email: `info@thenorthstarhouse.org`.
  - Reply-to email: `info@thenorthstarhouse.org`.
  - Subject: `North Star Historic Conservancy - Membership Renewal`.
  - Preheader: `A note of thanks and an invitation to renew your support.`
  - Original ACE editor content contains `[[FIRSTNAME OR "Friend"]]`, not `[[FirstName or "Friend"]]`.
  - Original ACE editor content contains `Renew My Membership`.
- Send completed 2026-05-12:
  - User gave explicit send-now approval.
  - Sent original 10-recipient draft, not the one-person proof copy.
  - API call: `POST /v3/emails/activities/fc2a1977-8435-494b-9bbd-4901d0f37946/schedules`.
  - Payload: `scheduled_date: "0"`.
  - Constant Contact response: HTTP `201`.
  - Returned scheduled timestamp: `2026-05-12T03:45:53.000Z`.
  - Repeated readback confirmed campaign status `DONE`.
  - Repeated readback confirmed activity status `DONE`.
  - Linear subissue `THE-11` marked `Done`.
  - Linear parent `THE-6` received send-completed comment.
  - Linear parent `THE-6` marked `Done` after all five subissues were complete.
  - Linear project update posted: `b5a99218-57e2-4e2f-acdb-92bb5af51c3d`; health `onTrack`; Linear diff showed `First production send: 0% -> 100%`.
  - Follow-up monitoring issue created: `THE-12` (`Monitor first long-lapsed renewal send results`), status `Todo`, priority `Medium`.
- `admin@thenorthstarhouse.org` is the Constant Contact account contact/default from/reply-to email.
- `info@thenorthstarhouse.org` is confirmed in Constant Contact and was used as explicit from/reply-to for the draft.
- Official Constant Contact docs say login verification emails go to the account email address. Constant Contact docs also say the account contact email can be changed from Account settings > Account emails, or through `PUT /v3/account/summary` as `contact_email`, if the new address is already confirmed and the authenticated user has Account Owner privileges.
- Current API state: `info@thenorthstarhouse.org` is confirmed but has no roles; `admin@thenorthstarhouse.org` has `CONTACT`, `DEFAULT_FROM`, and `REPLY_TO` roles.
- User approved changing the account contact email because the change can be reverted if needed.
- Applied 2026-05-12 via `PUT /v3/account/summary`: `contact_email` changed from `admin@thenorthstarhouse.org` to `info@thenorthstarhouse.org`.
- Readback after update confirmed `contact_email: info@thenorthstarhouse.org`.
- Earlier confusion: copying `NSH_EMAIL_ADMIN_PASSWORD` was not the same as copying `CC_LOGIN_PASSWORD`.
- `CC_LOGIN_PASSWORD` was later copied to the clipboard.

## Related artifacts

- Draft build report: `C:\Users\ender\.claude\projects\north-star-donors-gh\sidecars\constant-contact-long-lapsed-draft-build-2026-05-11.md`
- Original resume sidecar: `C:\Users\ender\.claude\projects\north-star-donors-gh\sidecars\long-lapsed-email-only-renewal-2026-05-11.md`
- Source HTML: `C:\Users\ender\.claude\projects\Vault\Membership Drive\email-drafts-2026-05-02\Long-Lapsed-Email-Only-Renewal.html`

## Gate candidates

- Merge: add concise Constant Contact auth breadcrumb to durable repo instructions only if this flow repeats.
- Promote: create a small helper for retrieving MFA emails only if manual retrieval keeps blocking work.
- Drop: password-copy confusion once MFA flow is resolved.
