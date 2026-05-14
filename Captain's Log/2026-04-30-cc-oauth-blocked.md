---
type: "captains-log"
date: "2026-04-30"
slug: "cc-oauth-blocked"
status: "partial"
created: "2026-04-30"
---

# Captain's Log — Constant Contact OAuth Attempt (Blocked)

> Tried to land Constant Contact OAuth tokens in `.env` to unblock CC interrogation; got blocked twice — sandbox denied the sudo+port-443 listener, and Kaelen was away from his computer so couldn't approve the prompt or authorize the OAuth URL in Chrome. Net progress: zero tokens, but staged scripts + a hallucination correction memory.

## Status & purpose

**What got done?** [Filled]
- Read `~/.claude/.env` — confirmed CC creds present: `CC_LOGIN_USERNAME`, `CC_LOGIN_PASSWORD`, `CC_CLIENT_ID`, `CC_CLIENT_SECRET`. No `CC_ACCESS_TOKEN` / `CC_REFRESH_TOKEN`.
- Found prior knowledge file at `knowledge/constant-contact-oauth.md` — past-self had registered NSH dev app on 2026-04-27 with redirect URIs `https://localhost` and `https://uvzwhhwzelaelfhfkvdb.supabase.co/functions/v1/cc-callback`, rate limit 10K/day + 4/sec, OAuth Authorization Code flow only.
- Built a localhost HTTPS catcher script at `/tmp/cc-oauth/catcher.py` with self-signed cert at `/tmp/cc-oauth/cert.pem` + `key.pem` to capture the OAuth code and exchange it for tokens.
- Built the authorization URL (scopes: `contact_data + campaign_data + account_read + offline_access`) and copied it to clipboard.
- Hallucination correction: wrote feedback memory at `feedback_no_filling_in_masked_text.md` after I read `a...n@thenorthstarhouse.org` (deliberately masked address) and confidently called the recipient "Aaron" — there is no Aaron. Memory rule: never expand redacted text into a guessed value; read literally or ask. Indexed in `MEMORY.md`.

**Why was it done?** [Filled]
The donor reactivation campaign needs CC interrogation as its #1 next step (per Captain's Log entry `2026-04-30-donor-drive-day-one-reactivation-schematic.md`). The interrogation is load-bearing because the entire campaign assumes CC has email coverage for the 79 unreachable donors — that hypothesis is still unverified. Landing OAuth tokens unlocks the API for tonight and forever, removing dependency on browser sessions for every future CC task.

**What was it supposed to accomplish?** [Filled]
End state: `CC_ACCESS_TOKEN` + `CC_REFRESH_TOKEN` written to `~/.claude/.env`, programmatic CC API access verified by a single test call (e.g. `GET /v3/account/summary`). Once that's done, future sessions can pull contacts, campaigns, reports without re-authorizing.

**What goals does it connect to?** [Filled]
Same goal-tree as the parent donor-drive log: NSH lapse rate reactivation, mapped (eventually, pending #5 inspection) to Master Portal `strategic_goals` rows for visible progress in the DonorApp UI.

## Scope & next moves

**What's still left to do on the whole?** [Filled]
- Resume OAuth flow when Kaelen is back at his computer.
- Pick the unblock path: (a) approve the sudo+port-443 capability for the catcher, OR (b) re-register a new redirect URI `https://localhost:8443` in CC dev portal so we don't need privileged-port access.
- Run the actual auth: open URL in Chrome → log into CC (`nshc1905` / `STAR!1905`) → grant scopes → CC redirects to localhost → catcher exchanges code for tokens → tokens land in `.env`.
- Verify with a single API call.
- Then proceed to actual CC interrogation: list contacts, fuzzy-match against the 79 unreachable, see what coverage we have.
- Long-term plan (already documented in `knowledge/constant-contact-oauth.md`): build `cc-callback` Supabase Edge Function in Master Portal + `cc_tokens` and `cc_campaign_stats` tables. Tonight's hacky `.env` storage is a stopgap — the durable answer is DB-backed tokens that any service can read.

**Immediate next steps**
- Resume CC OAuth attempt — Kaelen at keyboard + Claude — when Kaelen is home.
- Decide path (a) sudo-approve OR (b) re-register `localhost:8443` redirect URI — Kaelen — at resume time.
- Actually run the OAuth flow — together — at resume time.
- Verify token with API call — Claude — at resume time.

**Deadlines**
None hard. The parent donor-drive log has Monday 2026-05-04 deadlines for slide deck + CC interrogation; this OAuth work is a prerequisite for the latter, so effectively it inherits the Monday deadline.

**Owners**
Kaelen + Claude jointly. OAuth specifically requires Kaelen-at-keyboard for the browser auth step — Claude can do the URL-building and the token-exchange listener but not the click-through.

## Resource & capacity

**What did this cost?** [Filled]
~30 minutes of session time. No money. No external services hit (catcher never received a request). The cost was mostly attention — and trust, after the "Aaron" hallucination.

**Who else got pulled in?** [Filled]
Nobody. This was a Kaelen + Claude attempt. CC servers were never contacted.

**What did NOT get done because we did this?** [Filled]
Several available alternatives that don't need CC:
- `strategic_goals` table inspection on Master Portal
- Partial-address recovery sweep on the 79 unreachable
- Slide-deck skeleton (CC claims stubbed as `[VERIFY]` placeholders)
- DonorApp posting-format investigation
- Volunteer activation playbook design

Spending the night on OAuth meant none of these moved.

## Risk & dependency

**What could go wrong now that this is in motion?** [Filled]
- **Tokens-in-.env is hacky.** If Kaelen ever commits `.env` accidentally, secrets leak. Mitigation: `.env` is in `.gitignore` (verify when resuming).
- **Refresh token might not work.** OAuth refresh flows sometimes break silently — if `offline_access` scope wasn't granted properly, the access token expires in ~2 hours and we have to re-auth. Test the refresh path early.
- **Sandbox could deny again on retry.** The denial reason was specifically about "privileged-port listener + writing external credentials." If we go path (a), Kaelen needs to explicitly approve OR add a settings rule. Path (b) sidesteps this entirely.
- **CC dev portal app could have been disturbed since 2026-04-27.** Redirect URIs can be edited; if past-self's config drifted, the registered URIs might not match. Verify before assuming.

**What are we waiting on someone else for?** [Filled]
Nothing external — no Haley, no Wyn, no NSH staff. Pure self-block (Kaelen needs to be at his computer).

**What assumption are we making that we can't yet verify?** [Filled]
- **Past-self's CC dev app is still configured as documented.** Registered redirect URIs, scopes available, app not disabled. Verifiable on resume by visiting the CC developer portal.
- **The OAuth flow won't trigger 2FA on the API path.** Browser logins to CC dashboard go through 2FA (codes to the masked NSH address). API OAuth via authorization code grant should NOT require 2FA — but past-self didn't actually run the flow end-to-end, so unverified.
- **CC's `offline_access` scope works as standard OAuth — grants a refresh token.** Per their docs it does, but unverified until we run it.

## Decisions, stakeholders, learning

**Who needs to know this happened?** [Filled]
Just future-Kaelen + future-Claude (via this log). No external stakeholders.

**Has the right person been thanked or asked?** [Empty]
Not relevant — no human contact tonight.

**What did we decide, and why? What did we explicitly choose NOT to do?** [Filled]
Decisions made tonight:
- **Hacky-fast over right-way.** Chose to drop tokens into `.env` directly rather than build the documented Supabase Edge Function + token tables. Reason: tonight's goal was momentum, not durable plumbing. The "right way" is logged for a future `/grill-me` session.
- **Sudo + port 443 over re-registering port 8443.** Picked this path first because it matches the existing registered redirect URI as-is. Sandbox blocked it. Did NOT pivot to path (b) tonight because Kaelen wasn't at the computer for either path.
- **Stopped pursuing OAuth once Kaelen was away from keyboard.** Both paths require human-at-browser. Pretending otherwise would have wasted more time.
- **Wrote the hallucination memory immediately, not "later."** Catching that pattern (filling in masked text) is more important than tonight's tokens. Saved before resuming the work that triggered it.

What we explicitly chose NOT to do:
- Did NOT pivot to other unblocked work tonight (strategic_goals, address recovery, deck skeleton). Those got listed but Kaelen elected to write this log instead — consolidate the failure, set up for resume.
- Did NOT bypass the sandbox denial via creative workarounds. The denial was load-bearing — it correctly flagged a meaningful capability boundary.
- Did NOT attempt the Supabase Edge Function path tonight. Too much plumbing for a momentum-seeking session.

## 🔍 Threads we noticed

- **Sandbox capability friction.** Sudo + privileged-port + credential-write tripped the guardrail. If this comes up again (any local OAuth catcher, any token-landing flow), pre-stage approval or use unprivileged ports. Add to a future `claude-permissions-runbook` doc maybe.
- **Hallucination class: filling in masked text.** Saved as `feedback_no_filling_in_masked_text.md`. Watch for related patterns: filling in `[REDACTED]`, expanding `****1234` to a real account number, completing initials. Anywhere there's deliberate obscuring, the visible characters are absence-of-data.
- **Tokens-in-.env vs Edge Function vs Supabase Vault.** Three ways to store CC tokens long-term. Tonight's choice (env) is fastest but worst durability. Edge Function + DB tables is what past-self planned. Supabase has a `vault` extension that handles encrypted secrets at rest — possibly even better than DB tables. Worth comparing in the future grill-me.
- **Path-(b) is the cleaner unblock.** Re-registering `https://localhost:8443` in CC dev portal removes the sudo requirement permanently. ~2 min one-time setup. Probably the right move when resuming, instead of fighting the sandbox.
- **The "right way" build.** `knowledge/constant-contact-oauth.md` has the full spec for the Supabase-native build. When CC interrogation is done and we have findings, that build is the next infrastructure layer — `cc-callback` edge function + `cc_tokens` + `cc_campaign_stats` tables. That's its own captain's log when we get to it.
- **Redirect URI verification step missing from this attempt.** Should have started by hitting the CC developer portal and confirming the app config was unchanged before running the catcher. Cheap step, would have caught any drift early.
