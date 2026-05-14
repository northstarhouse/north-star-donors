---
type: "captains-log"
date: "2026-05-06"
slug: "arts-council-discovery-map-alpha-reference-build"
status: "complete"
created: "2026-05-06"
---

# Captain's Log — Arts Council Discovery Map Alpha Reference Build

> Locked the Nevada County Arts Council V1 direction as a culture-forward Discovery Map, recovered the real brand/data sources, and produced a disposable working reference build under stitch-lab to feed a future OpenDesign / Claude Design pass.

## Status & purpose

**What got done?**

- Found and validated the imported ChatGPT/Claude synthesis artifacts in the Arts Council repo.
- Used `grill-me` to lock V1 as a focused Discovery Map, not an Arts Hub, tourism platform, AI trip planner, or public launch.
- Wrote the internal brief at `docs/V1-DISCOVERY-MAP-BRIEF.md`.
- Created a living archaeology file at `docs/V1-DESIGN-ITERATION-INVENTORY.md`.
- Authenticated `gws` as `development@thenorthstarhouse.org` with Gmail read-only and found Diana Arbex's March 14, 2026 email containing the rough brand guide and data workbook.
- Verified the local `NCAC_brand-compressed.pdf` is byte-identical to the Gmail attachment.
- Confirmed the brand guide uses Polymath fonts and the live NCAC site uses Typekit Polymath plus NCAC red `#FF2500`.
- Downloaded Diana's `Cultural Assets - data engineering.numbers` and exported an inspectable `.xlsx`.
- Inspected the workbook: 16 cultural asset/data cleanup sheets, including source categories, duplicate/out-of-business flags, and Sofia notes about ESRI/data editor questions.
- Confirmed Arts Hub V2 exists locally and live at `https://arts-hub-v2.vercel.app/`, but decided it is reference-only.
- Produced a disposable working prototype at `website/cultural-map-redesign-stitch-lab/v1-discovery-map/`.
- Generated V1 data outputs: 1,076 visible places, 24 current mapped events from live Trumba RSS, 3 curated mapped paths.
- Added `docs/V1-DISCOVERY-MAP-DECISION-LOG.md`.
- Added `website/cultural-map-redesign-stitch-lab/v1-discovery-map/docs/DATA-GAPS.md`.

**Why was it done?**

The project had accumulated many overlapping artifacts: current NCAC asset map, ArcGIS history, Arts Hub V2, stitch-lab variants, Claude Design handoff, MUSE/current-site material, imported ChatGPT summaries, and Diana-provided brand/data files. The work was meant to sort signal from noise before the next design/build pass.

**What was it supposed to accomplish?**

Clarify the V1 product argument and preserve enough implementation proof that a future designer/agent can work from real constraints: current brand, current data, map-first scope, event/path behavior, and known data gaps.

**What goals does it connect to?**

- Help Arts Council stakeholders react to a concrete, culturally credible Discovery Map direction.
- Avoid reopening the politically loaded "Arts Hub / county-wide platform" fight.
- Preserve the user's memory and rationale before context compaction.
- Prepare source material for OpenDesign / Claude Design without prematurely treating the current code prototype as final design.

## Scope & next moves

**What is still left to do?**

- Run the real visual design process in OpenDesign / Claude Design.
- Treat the `v1-discovery-map` code artifact as source/reference, not the visual winner.
- Decide whether OpenDesign should start from screenshots, the static files, the generated JSON, or a distilled design brief.
- Reconcile data more rigorously if the alpha moves toward stakeholder presentation.
- Replace AI-labeled placeholders with real approved imagery where possible.
- Review path naming/copy against current MUSE and NCAC site language.

**Immediate next steps**

1. Use the new prototype README and data outputs as input for OpenDesign.
2. Create or export a clean OpenDesign prompt/package: brief, brand constraints, screenshots, data summary, paths/events/place cards, decision log.
3. Produce visual alternatives in OpenDesign before any further implementation polish.
4. Decide which pieces of the reference build survive: data prep, MapLibre behavior, panel IA, event matching, paths.

**Deadlines**

No firm deadline captured in this thread.

**Owners**

- Kaelen: decides whether OpenDesign is the next canonical design process and reviews outputs.
- Chat Gibbity / future agent: packages the source material, runs/designs against the locked constraints, and avoids treating the reference build as final.
- Arts Council / Diana / Eliza: eventual stakeholders for direction and feel, not current owners of this internal alpha.

## Resource & capacity

**What did this cost?**

Time and context. It also created several untracked repo artifacts that should be reviewed before committing or deleting.

**Who else got pulled in?**

- Diana Arbex indirectly, via email attachments and brand/data source material.
- Eliza indirectly, through project context and prior Arts Council committee history.
- Live NCAC/Trumba sources, via public website and RSS feed.
- Claude Design / OpenDesign as the intended future visual design channel.

**What did not get done because this happened?**

- No OpenDesign/Claude Design visual pass was actually run.
- No Vercel deployment was performed.
- No canonical project was modified.
- No final stakeholder-facing artifact was produced.

## Risk & dependency

**What could go wrong?**

- The disposable reference build could be mistaken for the final design direction.
- The visual treatment may still be too self-authored by Chat Gibbity and not enough OpenDesign/Claude Design.
- Data reconciliation is useful but not authoritative enough for public launch.
- Current Trumba events are live and time-sensitive; generated event JSON will become stale.
- The current V1 paths are plausible but not yet stakeholder-approved.
- AI placeholders could undermine trust if not visibly labeled or replaced before presentation.

**What are we waiting on someone else for?**

- Kaelen's decision to proceed with OpenDesign and what inputs it should receive.
- Arts Council feedback after a designed alpha exists.
- Real image assets and any explicit brand approvals beyond the rough guide/live site.

**What assumptions are unverified?**

- That Diana's March 2026 workbook is the best source authority.
- That Arts Hub V2 coordinates are acceptable as a coordinate reference.
- That the live NCAC site style should be treated as locked beyond typography/color/framing.
- That Polymath Typekit loading can be used safely in the alpha environment.
- That the MUSE-current "Local Life Trio" path themes are the right stakeholder demo set.

## Decisions, stakeholders, learning

**Who needs to know?**

- Kaelen now.
- Future agent/OpenDesign pass before any further implementation.
- Diana/Eliza later, if this becomes the basis for a stakeholder review.

**Has the right person been thanked or asked?**

Not applicable yet. Diana's source files were located, but no new outreach happened.

**What did we decide and explicitly not do?**

- Decided V1 is Discovery Map only, with "only" meaning focused, not small.
- Decided the current asset map UX is not the model, but the surrounding NCAC site design is a constraint.
- Decided Polymath/live NCAC typography supersedes older DM Sans / Plus Jakarta / Playfair experiments.
- Decided Arts Hub V2 can be burned down as direction, but mined for data, event matching, map mechanics, and path/story raw material.
- Decided to create a fresh `v1-discovery-map` shell under stitch-lab, while leaving canonical untouched.
- Decided events are a light layer, not a full calendar product.
- Decided paths are fixed curated overlays, not dynamic trip planning.
- Decided missing images may use visibly labeled AI placeholders in alpha.
- Explicitly did not deploy, touch canonical, or claim the prototype is final visual design.

**What surprised us or should change next time?**

The biggest process surprise: Kaelen did not intend to skip straight into a design/build process. "PLEASE IMPLEMENT THIS PLAN" was interpreted as execution permission, but the user expected another saved artifact or a more explicit handoff into OpenDesign. Future agents should pause at the boundary between planning artifact and visual execution when OpenDesign/Claude Design is in play.

The useful surprise: the "data engineering" Numbers file is a real cultural asset cleanup workbook, not a random attachment. Also, the local brand PDF was provably identical to Diana's Gmail attachment, ending a potentially expensive uncertainty.

## Threads we noticed

- OpenDesign should be the next design pass, with this reference build treated as input.
- The Captain's Log skill saves to the StarHouse Obsidian vault, not the working repo.
- `gws` auth is now live for `development@thenorthstarhouse.org` with Gmail read-only.
- There are untracked Arts Council repo artifacts that should be intentionally committed, archived, or cleaned.
- A future task may be to package the OpenDesign input bundle from brief + decision log + data summary + screenshots.
