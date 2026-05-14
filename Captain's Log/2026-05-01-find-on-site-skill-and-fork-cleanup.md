---
type: "captains-log"
date: "2026-05-01"
slug: "find-on-site-skill-and-fork-cleanup"
status: "complete"
created: "2026-05-01"
---

# Captain's Log — /find-on-site Skill + Fork Branch Cleanup

> Built a new `/find-on-site` slash command so Claude stops looking in the wrong places when Kaelen references things on the Master Portal mirror deploy, and ran a partial branch-hygiene pass on the donor-app fork that deleted three dead branches but parked a master-divergence question after /the-fool flagged the diagnosis as wrong.

## Status & purpose

**What got done?** [Filled]
- Designed and built `/find-on-site <text>` slash command at `~/.claude/commands/find-on-site.md`. Skill is vault-scoped to the Master Portal Vercel mirror deploy: searches mirror Supabase DB rows + ripgreps `~/code/north-star-donors/app/` in parallel, returns plain-English page+location matches with a 1-sentence guess. Auto-fires on phrases like "on the site / dashboard / donor app / that card / the [X] page." Three-tier graceful degradation: exact → fuzzy (drop stopwords, ≥2-keyword) → ask back. UI hits biased above DB row hits when noisy. Branch name printed in output as sanity check.
- Spawned a fork audit on the `~/code/north-star-donors` repo branches. Audit returned: live deploy = `feat/donor-app-improvements` (functionally; Vercel was triggered from a ghost branch `fix/vercel-routing` that no longer exists), with three dead branches and a diverged local `master`.
- Executed branch deletions: `feat/auth-magic-link` (local + remote), `feat/password-gate` (local), `fix/calendar-month-end-date` (remote). All three confirmed safe via captain's log + daily log evidence trail (the "abandoned magic-link auth" pivot to bcrypt password gate, logged 2026-04-29).
- Verified via /the-fool that the proposed `git reset --hard origin/master` was based on a wrong premise — the "4 stale local-only commits" were in fact reachable from `feat/donor-app-improvements` AND `upstream/master`, not unique-to-local. Two of them were sponsor-tier copy changes still live on the deploy. Reset paused.

**Why was it done?** [Filled]
- The `/find-on-site` skill was triggered by direct Kaelen frustration: *"I'll often be referring to things on the site, and you won't know what I'm talking about and you'll look in places other than the site unless I specifically tell you about the site, which is kind of annoying."* Today's example: he asked about a "constant contact grill todo on the dev dashboard" — Claude searched the vault, memory, and dev folder, found nothing, and had to ask. The actual item was on the Master Portal Vercel mirror deploy.
- The fork branch cleanup was triggered as a side branch from the same skill design: when designing the skill's branch-awareness behavior, Kaelen said *"don't know what the fuck with the branches. can we /fork a cleanup on that?"* The skill design itself paused on Q10 (branch awareness) until cleanup gives a clean baseline.

**What was it supposed to accomplish?** [Filled]
- `/find-on-site`: collapse the recurring friction of Claude searching wrong places when Kaelen points at the deployed site. Auto-detect site references and translate technical results (file paths, table names) into plain English (page name + location).
- Fork cleanup: produce a tidy branch list so future "what's deployed / what's safe to delete" questions have an obvious answer; remove obvious dead branches without breaking anything live.

**What goals does it connect to?** [Filled]
- Both connect to the broader **vault-as-second-brain operating maturity** push: knowledge capture and skill-building so Kaelen spends less time re-explaining context to Claude every session. Adjacent to the Master Portal mirror infrastructure work (the password gate, the mirror schema work, the donor reactivation kanban prototype) — the skill's existence presumes Master Portal is now the canonical surface for Kaelen's day-to-day reference.

## Scope & next moves

**What's still left to do on the whole?** [Filled]
- Test `/find-on-site` on a real reference. Skill is built but un-exercised. First real invocation will likely surface tuning needs (which table-name → human-surface mappings are missing, whether the auto-fire phrase list is too greedy or too narrow, whether the DB-query implementation actually works — it's spec'd but not yet executed end-to-end).
- The local `master` branch on `~/code/north-star-donors` remains diverged from `origin/master` (4 ahead, 7 behind). Parked deliberately after /the-fool flagged the original "stale magic-link" framing as wrong. Cosmetic-only divergence; Kaelen never works from local master anyway.
- 10 unmerged improvements from upstream Haley repo on `upstream/master` (calendar polish, scheduled-status amber styling, list CSV export tweaks). Not pulled.
- Vercel deploy currently uses a ghost branch ref `fix/vercel-routing` that no longer exists in any repo. Functionally OK (commit matches `feat/donor-app-improvements` HEAD) but would benefit from inspecting Vercel project's git connection setting to fix.
- Pre-existing pending task #132 "F4 — Decouple T9 (dead-code delete) from prod rollout" — actual magic-link dead-code deletion (RequireAuthStatic.tsx, app/login/, app/auth/, lib/supabase.ts re-export). Independent of the branch deletions; the *files* still exist on the live branch.

**Immediate next steps**
- Test `/find-on-site` on a real "on the site" reference — Kaelen + Claude — next session.
- Inspect Vercel git connection setting to resolve `fix/vercel-routing` ghost ref — Kaelen — anytime, low priority.
- (Optional) Pull upstream/master into local master, then sync origin — Kaelen — anytime, cosmetic.

**Deadlines**
None hard. All cleanup-class work.

**Owners**
Kaelen for everything operational; Claude for actually executing /find-on-site invocations when triggered.

## Resource & capacity

**What did this cost?** [Filled]
~75 minutes of session time. Two forked sub-agents (one for branch audit, one for /the-fool pre-mortem). No money. No external services touched beyond GitHub branch deletions on the fork repo (origin only — never touched Haley's upstream).

**Who else got pulled in?** [Filled]
Nobody human. Two sub-agent forks: branch-hygiene auditor and /the-fool pre-mortem. /grill-me skill ran the design conversation for /find-on-site.

**What did NOT get done because we did this?** [Filled]
- The CC OAuth resume work (the original "constant contact grill" thread that started the session) never happened. Skill-building consumed the session.
- The pending task #115 "P8 — 8-step end-to-end test sequence" still pending.
- The pending task #132 "F4 — Decouple T9 (dead-code delete) from prod rollout" still pending.
- Donor reactivation campaign work (the Monday 2026-05-04 deadline from the parent donor-drive log) didn't progress.

## Risk & dependency

**What could go wrong now that this is in motion?** [Filled]
- `/find-on-site` is spec'd but not exercised. The mirror DB query path is theoretical — the skill describes querying `information_schema` and running ILIKE across all text columns but doesn't yet contain the executable code. First real invocation may discover the implementation needs more scaffolding (e.g., a helper script, or a chosen execution path: psql vs REST vs Node client).
- The auto-fire trigger phrases are a guess. Could over-fire ("that card" in a literal-card context) or under-fire (Kaelen using a phrase not on the list). Tuning required.
- The vault-snapshot at `_starhouse/north-star-donors/source/` is now known stale. Anyone (including future-Claude) reading those files thinks they're current — they're not. The live truth is `~/code/north-star-donors/`.
- Branch deletions are irreversible without ref-recovery via reflog. Three were verified safe via captain's log evidence; if any of them turn out to have unique work that wasn't on the live branch, recovery requires git reflog before garbage collection runs (~30 days).
- The wrong-diagnosis episode (the audit fork called the 4 master commits "stale magic-link work" when 2 were sponsor-tier copy) suggests the audit fork's framing should be treated as draft, not gospel — even when its summary sounds authoritative.

**What are we waiting on someone else for?** [Filled]
Nothing external. No Haley, no Wyn, no NSH staff. Pure Kaelen+Claude cleanup work.

**What assumption are we making that we can't yet verify?** [Filled]
- That the `/find-on-site` skill description is enough for future-Claude to execute it correctly without further scaffolding. Unverified until first real invocation.
- That the three deleted branches truly had no unique work. Verified via captain's log narrative + commit-reachability check, but a buried gem in one of those commits would now require reflog recovery.
- That `feat/donor-app-improvements` accurately represents what's deployed. Vercel says it's deploying from `fix/vercel-routing` (a ghost ref); HEAD commit matches `feat/donor-app-improvements` HEAD, so functionally equivalent — but the Vercel git-connection setting is unexamined.

## Decisions, stakeholders, learning

**Who needs to know this happened?** [Filled]
Just future-Kaelen + future-Claude. The `/find-on-site` skill is a Kaelen-private workflow tool. The branch deletions are on Kaelen's fork, not Haley's upstream — no external stakeholder impact.

**Has the right person been thanked or asked?** [Empty]
Not relevant — no human contact this session.

**What did we decide, and why? What did we explicitly choose NOT to do?** [Filled]

Decisions:
- **Skill is vault-local AND scoped to one specific deploy** (Master Portal Vercel mirror fork at `~/code/north-star-donors`, mirror DB `SUPABASE_NSH_MASTER_PORTAL_MIRROR_*`). Not Haley's upstream. Not Kaelen's own Command Center. Tight scope = high accuracy. If he means a different surface, he'll say so explicitly.
- **Two-layer search (DB + source code), DB-first with code-grep fallback.** Source-parsing-for-table-discovery was discarded as over-engineering — `information_schema` at runtime is the cleaner answer.
- **Plain English output, no schematic/jargon.** Per Kaelen: *"don't need the schematic and technical stuff. just speak to me like a normal human. refer to what it looks like on the site and where as much as possible."* Skill talks about pages and cards, not file paths and tables.
- **Auto-fire on site-reference phrases** rather than requiring explicit `/find-on-site` invocation. The whole point was to remove friction; forcing a slash command recreates it.
- **HEAD-tracking with branch-in-output**, deferring "always search deployed branch" to v2 after branch-cleanup story stabilizes.
- **Branch-cleanup audit produces proposals, not auto-execution.** Kaelen approves before destructive operations.
- **Master reset paused after /the-fool pre-mortem.** Original premise was wrong; cosmetic-only divergence doesn't justify a destructive operation on a wrong story.
- **Master divergence stays as-is.** Kaelen explicitly chose: *"I don't care man. I don't want to break things. I just want things to be clean without imposing danger. fuck it for now?"* Walking away is the right call when the value of the cleanup is purely cosmetic and the cost of getting it wrong is non-zero.

What we explicitly chose NOT to do:
- Did NOT auto-fire branch operations. Every destructive git command paused for explicit Kaelen approval.
- Did NOT pursue Vercel git-connection investigation (`fix/vercel-routing` ghost ref) tonight. Functional, can wait.
- Did NOT pull upstream/master changes. 10 unmerged commits from Haley sit there. Defer.
- Did NOT delete the magic-link dead code files (still on the live branch) — that's a separate task (#132) requiring its own decision context.
- Did NOT install `/find-on-site` globally (`~/.claude/commands/`). Wait — we DID install it there, not vault-local as originally planned. Slight drift from the "vault-local" decision in the grill: the grill said vault-local at `.claude/skills/find-on-site/`, but the actual install went to `~/.claude/commands/find-on-site.md` (global slash-commands path). Functionally fine — the skill IS scoped to one specific repo path so it only does anything useful in that context — but worth flagging that the placement decision drifted.

**What surprised us? What was harder than expected?** [Filled]
- The audit fork's diagnosis was confidently wrong on the master-divergence framing. Called the 4 unique commits "stale magic-link work to discard" when in fact two were sponsor-tier copy and two were auth scaffolding. /the-fool caught it because the pre-mortem forced verification of "what would guarantee failure: acting on a wrong diagnosis" — and the diagnosis was already wrong before the destructive command ran. This is now a pattern: audit-fork summaries should be treated as draft, not gospel, especially when they recommend destructive operations.
- The vault snapshot at `_starhouse/north-star-donors/source/` was stale and incomplete (3 pages, missing auth/coordination/content-calendar/ideas/outreach/(protected)). The live repo at `~/code/north-star-donors` had way more pages. Lesson: when a session involves "what's on the site," always check `~/code/` first, not the vault's snapshot folder.
- Vercel deploys from a branch that doesn't exist anywhere (`fix/vercel-routing`). Probably a stale Git connection in the Vercel project settings. Surprising because the deploy still works — Vercel tracks the commit SHA, not the ref name, and the SHA happens to match `feat/donor-app-improvements` HEAD.
- The branch deletion batch failed mid-run because one branch (`feat/password-gate`) didn't exist on origin (it was local-only and already deleted). Git aborted the whole batch push instead of skipping the missing one. Lesson: for destructive batch operations, run individually so one failure doesn't block the others.

## 🔍 Threads we noticed

- The `/find-on-site` skill placement drifted from "vault-local at `.claude/skills/find-on-site/`" to "global at `~/.claude/commands/find-on-site.md`" without explicit re-decision. Functionally fine but worth noting if anyone wonders later.
- Pending task #132 ("F4 — Decouple T9 dead-code delete from prod rollout") is now ~2 days old. The magic-link dead code (RequireAuthStatic.tsx, app/login/, app/auth/, lib/supabase.ts re-export) still ships in production. Worth its own session.
- Vercel `fix/vercel-routing` ghost ref needs Vercel project settings inspection. Probably a 5-min fix.
- 10 unmerged improvements on `upstream/master` (Haley's repo): calendar polish, scheduled-status amber styling, list CSV export tweaks. Worth a one-shot pull-and-merge session.
- The audit-fork-summary-as-draft pattern: when an audit recommends destructive operations, verify the framing before acting. /the-fool's pre-mortem caught it this time; the next time may not have that backstop.
- The `_starhouse/north-star-donors/source/` snapshot is stale. Either refresh it on a schedule or delete it and rely on `~/code/north-star-donors/` only. Snapshot drift creates wrong-source-of-truth risk.
- The original session prompt — the "constant contact grill todo on the dev dashboard" — never got addressed. Still parked on the Master Portal dashboard.
