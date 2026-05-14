---
type: "captains-log"
date: "2026-05-01"
slug: "donor-mirror-kanban-prototype"
status: "complete"
created: "2026-05-01"
---

# Captain's Log — Donor Mirror Kanban Prototype

> Built a working mirror-deployment prototype loop on `master-portal-fork.vercel.app`: multi-axis tagged kanban tasks (label[] + domain[]) populated with the donor-drive captain's log backlog, jsonb `Strategic Goals.updates` with optional details-link, expanded taxonomy (Infrastructure + Stakeholder Outreach), and a Vercel routing fix so the deployment actually loads at root. Mirror is now the canonical playground — earn changes there first, push to Haley once vetted via fat-diff + live tour.

## Status & purpose

**What got done?**
- On the fork repo (`~/code/north-star-donors`):
  - Added second tag axis: `domain text[]` alongside array-typed `label text[]` on `tasks`. Migration on mirror Supabase (`pasamzrwwaqhiwkixpbt`) cleanly wrapped existing single-string labels to 1-element arrays.
  - Updated Task type, row pill rendering, filter, and rebuilt Add Task form with checkbox-pill multi-select for both axes.
  - Expanded taxonomy by 2 values: `Infrastructure` (domain) for DonorApp dev work, `Stakeholder Outreach` (label) for check-ins / pitches / asks.
  - Migrated `Strategic Goals.updates` from `text` to `jsonb`, added `details_link` entry type, replaced verbose "View Updates" expander with small "Full update →" link on goal card. Existing Haley narrative entries auto-wrapped to `[{type:'narrative', body: ...}]` (backward-compatible).
  - Forked sub-agent fixed the Vercel root-URL 404 (committed `4f24747` on `fix/vercel-routing`): `next.config.ts` now conditionally applies `basePath`/`output: 'export'` only when NOT on Vercel. GitHub Pages still gets static export at `/north-star-donors/`; Vercel gets dynamic build at root.
  - Backfilled donor-drive captain's log into 18 mirror task rows (8 done, 1 in-progress, 9 todo) with multi-axis tags.
- On mirror DB:
  - Added `app_passwords` row (`mirror-NSH-claude`) so live `NSH` password unlocks mirror's password gate.
  - Patched goal #1: `On track`, Lead: Kaelen Schmidt, Due: 2026-12-31, single `details_link` entry in `updates`.
- Vercel: 2 production deploys via `vercel --prod --yes` + manual aliasing. Project does NOT auto-deploy from git pushes.

**Why was it done?**
- Started as "build a richer goal-card update render" (5 entry types from captain's log schema). User pivoted mid-session to "lean — just status + link, full content lives elsewhere." The rich renderer got abandoned; simpler `details_link` shape stayed.
- Multi-tag emerged from real diagnostic: goal #1's description names 5 fund-dev domains (Donors / Members / Sponsors / Grants / Earned Revenue) but Haley's 9 task labels are work-types. Single-tag flattened the two axes; two columns match the actual mental model.
- Vercel 404 fix triggered by user unable to share/view a working mirror URL.
- Backfilling tasks from captain's log tested whether the new taxonomy actually held up; surfaced the 2 taxonomy gaps that drove `Infrastructure` + `Stakeholder Outreach` additions.

**What was it supposed to accomplish?**
A working mirror-deployment prototype loop: a place where we can ship UI shape, schema additions, taxonomy expansions end-to-end before showing Haley a fat-diff + live tour and asking her to merge upstream. Tonight proved the loop by shipping multi-tag kanban + Vercel fix on the mirror.

**What goals does it connect to?**
- Strategic Goals #1 (Fund Development Plan) — literally. The mirror dashboard's task panel is now populated with the donor-drive's actual backlog tagged by fund-dev domain. That's the campaign progress made visible.
- Loosely to the broader DonorApp infrastructure thread (now tagged `Infrastructure` itself).

## Scope & next moves

**What's still left to do on the whole?**
- Show Haley the prototype: tour `master-portal-fork.vercel.app` + show diff vs her `northstarhouse/north-star-donors` master. Get verdict on multi-tag direction before merging upstream.
- If she likes it: prepare a clean PR to upstream master (squashed commits, no mirror-only artifacts in the diff).
- If she wants changes: iterate on mirror first, re-tour.
- Wire up Vercel auto-deploy from git pushes so we don't have to `vercel --prod --yes` manually each time.
- Live DB migration plan: when this lands on Haley's live, `tasks.label` and `Strategic Goals.updates` need parallel migrations. Plan the exact SQL + rollback path.
- Continue using mirror as the workshop for any future DonorApp features.
- Clean up branch state: `feat/structured-goal-updates` is empty, `fix/vercel-routing` carries everything. Either rename or merge.

**Immediate next steps**
- Tour mirror with Haley and present the diff — Kaelen → Haley — by 2026-05-04 (Monday)
- Decide branch consolidation (rename `fix/vercel-routing` → something more accurate, or merge into a feature branch) — Kaelen — anytime
- Investigate Vercel auto-deploy wiring — Kaelen — when convenient
- Plan live DB migration parallel to any future merge — Kaelen — pre-merge

**Deadlines**
Monday 2026-05-04 for the Haley tour (matches the parent donor-drive log's deadline cluster).

**Owners**
Kaelen on everything. Haley is recipient on the tour + verdict.

## Resource & capacity

**What did this cost?**
~3 hours of session time. No money. Substantial attention — the work was iterative with multiple pivots (rich renderer → lean link → multi-tag → taxonomy expansion).

**Who else got pulled in?**
A forked sub-agent for the Vercel routing fix (worked in an isolated worktree, pushed `fix/vercel-routing` branch, deployed via Vercel CLI). Also forked earlier sub-agents during the strategic_goals investigation.

**What did NOT get done because we did this?**
Constant Contact OAuth — the original Monday-deadline task. Pushed to next session. CC interrogation also pushed.

## Risk & dependency

**What could go wrong now that this is in motion?**
- **Mirror-live divergence accumulates.** As we keep prototyping on the mirror, the schema and taxonomy drift further from Haley's live. Each change adds to the eventual merge cost. Mitigation: tour with Haley sooner rather than later, get her sign-on before piling on more changes.
- **Mirror DB doesn't get re-synced from live.** If Haley adds new data to live, the mirror is now stale. We're treating mirror as canonical for our work; she's treating live as canonical for hers. This is fine until we want to merge or compare.
- **Manual Vercel deploys forgotten.** If we update the fork repo and forget to `vercel --prod --yes`, the deployed mirror falls behind the code. Easy to confuse "I see the change locally" with "Haley sees it."
- **Multi-tag is opt-in for Haley, but UI changes aren't.** Even if she keeps her single-tag style, the rendering changes in `app/page.tsx` are global. Backward-compat is real but the UI would still look slightly different.
- **The `Strategic Goals.updates` jsonb migration on live is irreversible-ish.** Reverting `jsonb → text` requires deciding what to do with the array structure. Plannable but not free.

**What are we waiting on someone else for?**
Haley's verdict on the prototype. Until she sees it and reacts, the merge upstream is blocked.

**What assumption are we making that we can't yet verify?**
- **Haley will like multi-tag.** Working hypothesis based on the goal description naming the 5 domains. She might prefer to keep single-tag. Verifiable on the tour.
- **The 5 fund-dev domains + 1 Infrastructure are the right canonical set.** Could need a `Volunteers` domain (we left "build volunteer playbook" domain-less). Could need others not yet imagined.
- **Stakeholder Outreach is a useful label.** One task uses it tonight. Convention emerges with more usage.
- **The mirror Vercel deploy is sufficient as a tour artifact.** Maybe Haley wants to see the actual UI in her own browser session; maybe a Loom-style screencast is needed. Unverified.

## Decisions, stakeholders, learning

**Who needs to know this happened?**
- Haley — primary audience for the tour, primary stakeholder on whether this lands upstream.
- Future-Kaelen — needs to know the mirror is now the canonical playground for any DonorApp changes (the meta-pattern, not just this one feature).
- Future-Claude — needs to know the deploy command (`vercel --prod --yes`), the alias step (`vercel alias set <deploy> master-portal-fork.vercel.app`), and the password gate setup (`mirror-NSH-claude` row already exists).

**Has the right person been thanked or asked?**
Forked sub-agent that fixed the Vercel routing — its work is committed and aliased; no thanks needed but the diff is preserved on `fix/vercel-routing`.

**What did we decide, and why? What did we explicitly choose NOT to do?**
- **Mirror = canonical prototyping playground.** Standard from now on for DonorApp changes. Push to live only after Haley signs on. Reason: lets us iterate hard without touching her production data, and gives her a real artifact to evaluate.
- **Two tag axes (label work-type + domain), not one.** Reason: matches the actual mental model. Multi-tag both axes via `text[]`.
- **Lean goal card with `details_link` only, NOT verbose 5-type panel.** Reason: user explicitly pivoted away from rich render mid-session ("just say On track for now, host details elsewhere if needed"). Goal card stays small; richness lives in linked HTML / Captain's Log later.
- **`Infrastructure` domain + `Stakeholder Outreach` label.** Reason: backfilling captain's log surfaced 5+ tasks that didn't fit existing taxonomy. Conservative addition (1+1) rather than a full overhaul.
- **Did NOT add `Volunteers` domain.** One task wanted it; left domain-less for now. Add when usage demands.
- **Did NOT push the branch upstream.** Stays on origin (Kaelen's fork). Upstream PR happens after Haley tour.
- **Did NOT do the Constant Contact OAuth tonight.** Original Monday deadline still hanging.

## 🔍 Threads we noticed

- **Vercel project has no GitHub auto-deploy integration.** Future updates need `vercel --prod --yes` from CLI. Worth wiring up the GitHub integration on Vercel's dashboard so pushes auto-deploy.
- **`feat/structured-goal-updates` branch is empty (no commits).** Real work landed on `fix/vercel-routing`. Branch state is misleading; rename or merge.
- **`stash@{0}` (`parent-wip-structured-goal-updates`) is stale** — contains the abandoned GoalUpdatesPanel code. Probably safe to drop since we pivoted away.
- **Mirror's localStorage `nsh-app-token` has 30-day expiry** — token used for the tour will work until early June.
- **Live still has `tasks.label` as `text` (not array) and no `domain` column.** Any merge upstream needs a parallel migration on live + backfill plan.
- **Goal #1 details_link points to placeholder URL (`https://example.com/donor-drive-update`).** Replace with actual hosted captain's log render when one exists.
- **Captain's Log → goal-update entry types is a real mapping** — the 5-type schema (narrative/milestone/next_step/blocker/decision) genuinely projects from the 18-question schematic. We abandoned the inline rendering but the *projection idea* is still good for any future hosted-detail page.
- **Personal deadline-management still TBD.** Came up multiple times; not a fund-dev concern; lives somewhere else when we figure out where.
- **CC OAuth catcher still staged at `/tmp/cc-oauth/`.** Resume when home + at keyboard for the browser auth step. Path: re-register `https://localhost:8443` in CC dev portal to avoid sudo+443.
