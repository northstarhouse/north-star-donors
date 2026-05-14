---
type: "captains-log"
date: "2026-05-05"
slug: "protected-campaign-overview-merged"
status: "complete"
created: "2026-05-05"
---

# Captain's Log — Protected Campaign Overview Merged

> A proposed public static campaign artifact was replaced with a protected Supabase-backed Membership Campaign Overview surface in Haley's Master Portal, then reviewed, hardened, and merged through PR #3.

## Status & purpose

**What got done?**
The `codex/static-campaign-overview` branch was rewritten from its unsafe first shape into a protected Master Portal Patch and merged as [northstarhouse/north-star-donors#3](https://github.com/northstarhouse/north-star-donors/pull/3). The merged PR changed four files:

- `app/page.tsx` — added a compact Fund Development Plan hub under the existing Fund Development card.
- `app/(protected)/campaigns/2026-membership-email/page.tsx` — added a protected Membership overview route.
- `supabase/migrations/20260505010525_add_protected_documents.sql` — added `protected_documents`.
- `supabase/schema.sql` — recorded the same protected document schema.

The Home card now has six plan-area slots: Membership, Donors, Sponsorships, Grants, Earned Revenue, and Infrastructure / Systems. Membership is the only live overview link.

The Membership overview content was seeded into the correct Master Portal Supabase project, `uvzwhhwzelaelfhfkvdb`, not the Mirror. The app route is only a static shell; it fetches `protected_documents.slug = '2026-membership-email'` at runtime after the existing app-password session is valid.

**Why was it done?**
The user wanted a small, visible MVP for campaign planning on Haley's site without prematurely redesigning the whole site or adding a top-level Campaigns module. The first implementation attempt put raw campaign HTML under `public/campaigns/...`, which would have been publicly reachable through GitHub Pages. The work pivoted to the model the user intended: store sensitive campaign content in Supabase and render it inside the protected app.

**What was it supposed to accomplish?**
It was supposed to create a low-friction Campaign Overview Surface for the 2026 Membership Email Campaign while respecting the constraints of Haley's static GitHub Pages deployment. It also created a starting structure for future fund-development work to be slotted by area rather than dumped into one generic task stream.

**What goals does it connect to?**
This connects to the 2026 Membership Renewal Campaign, the Master Portal Patch pathway, and the broader Information-led UI Patch pattern: start from the information that needs to be visible, then decide how much UI the live Master Portal can honestly support.

## Scope & next moves

**What's still left to do?**
The merged MVP only creates the protected overview surface and the six plan-area slots. It does not yet break the campaign overview into tasks, statuses, labels, timeline records, calendar entries, or distributed site surfaces.

The next discussion should decide how to piece out the protected overview content into work items and where those work items belong:

- within Haley's current Master Portal task model,
- within Kaelen's Mirror/Cockpit-style task and label model,
- or within a purpose-built campaign/fund-development workspace on Haley's site.

**Immediate next steps**

- Run a `grill-with-docs` session on task/status/labeling choices before implementing more UI.
- Inventory the current Haley app constraints: task statuses, labels, visible cards, routes, and what can be represented without schema churn.
- Compare those constraints with what Kaelen has already prototyped on the Mirror/Cockpit side.
- Decide whether Membership campaign tasks should start as current-app tasks, new protected document sections, or a new campaign workspace.

**Deadlines**
No hard new deadline was set in this session. The campaign itself still sits in the May to July 2026 membership drive window.

**Who owns each step?**
Kaelen owns the product judgment and whether Haley should see this now. Codex can run the app/vault audit, propose status and label mappings, and implement the next narrow patch after review.

## Resource & capacity

**What did this cost?**
The work cost one focused Codex implementation/review loop, one Supabase table applied to the Master Portal project, one protected document seed, and one GitHub PR. No package dependencies were added.

**Who else got pulled in?**
No additional humans were pulled in during the implementation. Haley's live app was mutated through the upstream repo and Supabase project after review.

**What did not get done because this happened?**
No campaign tasks were extracted. No labels/status taxonomy was changed. No new Campaigns sidebar tab or purpose-built workspace was created. The session intentionally stopped before deciding where campaign work should live beyond the protected overview.

## Risk & dependency

**What could go wrong?**
The protected document route depends on the existing `PasswordGate` / `has_valid_app_session()` app-token model. If that token flow changes, protected document reads need to be retested. The content is rendered into an iframe from Supabase HTML, so the iframe was explicitly hardened with `sandbox=""` before merge.

The local branch still shows as ahead of `upstream/master` because PR #3 was squash-merged into master, leaving the local feature branch commit separate from the merge commit. That is a local git bookkeeping issue, not evidence that the PR failed to merge.

**What are we waiting on someone else for?**
Haley has not yet reviewed this new Fund Development hub. Future work depends on whether the team wants campaign tasks to live in her current app primitives or in a more specific campaign/fund-development model.

**What assumptions are unverified?**
It is assumed that the protected overview page will be understandable from the Fund Development card without a new top-level navigation item. It is also assumed that the current app-password session model is acceptable for protecting draft campaign strategy. Both should be checked in live use.

## Decisions, stakeholders, learning

**Who needs to know this happened?**
Future Kaelen and future Codex need to know that the Membership Campaign Overview is now a Supabase-backed protected document in the Master Portal, not a static file in the repo. Haley may need to know once Kaelen decides the Fund Development hub is ready to explain.

**What did we decide and explicitly not do?**
We decided to:

- keep the overview behind the existing protected app flow;
- use Supabase `protected_documents` as the content home;
- expose Membership as the first live Fund Development Plan slot;
- keep Donors, Sponsorships, Grants, Earned Revenue, and Infrastructure / Systems as placeholders.

We explicitly did not:

- keep `public/campaigns/...`;
- add a Campaigns sidebar tab;
- bake the campaign strategy into static JSX;
- add package dependencies;
- extract tasks yet;
- redesign Haley's site around campaign work yet.

**What surprised us or should change next time?**
The first protected route attempt still leaked content through static export because Next/GitHub Pages generated the route as public files. The key lesson is that PasswordGate can hide a UI, but it cannot make statically exported content secret. Sensitive content must live behind a runtime data gate.

The Supabase CLI was initially linked to The Mirror project (`pasamzrwwaqhiwkixpbt`) while `.env.local` pointed to the Master Portal project (`uvzwhhwzelaelfhfkvdb`). A protected table was briefly created in the wrong project, then removed. Future Supabase work should check CLI project ref against `.env.local` before applying schema.

## Threads we noticed

- Run `grill-with-docs` on how campaign overview pieces become `todo`, `in_progress`, and `done`.
- Audit what labels/statuses Haley's current app actually supports before inventing new work categories.
- Compare Haley's current app against Kaelen's Mirror/Cockpit task-label model.
- Decide whether the next patch should use current app primitives or create a purpose-built fund-development/campaign workspace.
- Reconcile local git after squash merge if future work continues in the same repo.
