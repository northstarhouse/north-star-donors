# Drilldown sidecar - Grant work recovery and Linear port
Date: 2026-05-12
Goal: Recover and organize North Star grant work end to end; create Linear-ready grant work with research, sources, blockers, dates, next actions, and acceptance criteria.

## Guardrails

- Linear writes: user gave advance approval, but repo rule still requires exact target and payload before mutation.
- Supabase / Development Dashboard writes: no mutation without explicit approval.
- Plane writes: no mutation.
- GitHub / production writes: no mutation without explicit approval.
- Research path: use Perplexity Browser in the user's normal Chrome session.

## Environment binding

- DDD environment: production/live dashboard for the three provided GitHub Pages task URLs.
- Live dashboard source: Supabase live project via local env credentials.
- Repo: `C:\Users\ender\.claude\projects\north-star-donors-gh`

## Source dashboard tasks

| Task | Status | Label | Owner | Due | Initiative | Notes | Comments |
|---|---|---|---|---|---|---|---|
| Research funding options for bat netting and upstairs doors (`55b3f2e7-5426-4299-b0cc-d304b02c715d`) | todo | Research | Kaelen | none | Grants | none | 0 |
| Research USDA Community Facilities grant fit (`4f1bf813-3560-4f6e-9fad-0f1af40d0876`) | todo | Research | Kaelen | none | none | USDA Community Facilities URL | 0 |
| Port current pursued grants into Development Dashboard (`1358d1dc-9281-4c48-a45a-4b9d303d7c59`) | todo | Technical | Kaelen | 2026-05-11 | none | none | 0 |

## Dashboard baseline

- Live dashboard task count: 17.
- Status counts: done 6, todo 9, in_progress 2.
- Label counts: Other 2, Decision 5, Research 3, Technical 4, Editing 2, Blog Post 1.
- Grant-specific visible tasks: the three source dashboard tasks above.
- Adjacent funding/sponsorship context also exists in sponsorship tasks, but it is not the grant cluster unless source evidence says otherwise.

## Dashboard cross-check

| Brief claim | Dashboard match | Status | Proposed handling | Validation question |
|---|---|---|---|---|
| Current pursued grants need to be brought into the work system. | `Port current pursued grants into Development Dashboard` | todo, Technical, due 2026-05-11 | update existing / possible Linear parent issue | Does Plane contain the authoritative pursued-grant inventory? |
| USDA Community Facilities may fit North Star House. | `Research USDA Community Facilities grant fit` | todo, Research | create Linear research issue after Perplexity + source read | Is this one grant fit issue, or part of a broader facilities capital funding lane? |
| Bat netting and upstairs doors need funding routes. | `Research funding options for bat netting and upstairs doors` | todo, Research, Grants initiative | create Linear research/options issue after transcript grounding | Does transcript frame this as grants, local asks, sponsorship, public-health/safety funding, or all of these? |

## Plane inventory recovery

- Plane API read succeeded using local `PLANE_API_KEY`.
- Workspace: `northstarhouse`.
- Projects recovered: 11.
- Work items recovered: 35.

| Plane project | Amount / window | Existing Plane work | Proposed Linear handling |
|---|---:|---|---|
| HER Grant Resubmission | $750K / Sept 30, 2026 | 20 items | Parent issue with Plane work items listed; likely future milestone/subissues. |
| Schwemm Family Foundation | ~$8K / May 1-June 30, 2026 | 5 items | One execution issue with five next actions. |
| CA Arts Council GOS | up to $25K-$30K / May 12, 2026 | 5 items | One urgent status/recovery issue; verify missed/still-actionable state. |
| CA Arts Council Impact Projects | up to $25K / May 12, 2026 | 0 items | Child/context issue only if GOS backup track remains viable. |
| NEA Grants for Arts Projects | $10K-$100K / Intent July 9, 2026 | 5 items | One issue plus urgent registration tasks. |
| Hind Foundation | $10K-$50K / rolling | 0 items | Blocked issue; needs proof of deposited funds and discrete restoration scope. |
| Long Foundation | $10K-$40K / opens July 27, 2026 | 0 items | Backlog research issue for youth arts/education frame. |
| NEH Collections Stewardship | unknown / May 11, 2026 | 0 items | Backlog or dead-cycle issue; qualifying collection gate. |
| NEH Media Projects | unknown / June 25, 2026 | 0 items | Research issue for Julia Morgan media angle. |
| NTHP Preservation Fund | $2.5K-$5K / June 1, 2026 | 0 items | Near-term issue; overlaps bat exclusion preservation framing. |
| NCA Cultural District Mini-Grants | unknown / cycle unknown | 0 items | Research issue; local lead, eligibility/cycle unknown. |

## Transcript/source search

- Canonical transcript found: `C:\Users\ender\.claude\projects\Vault\data\transcripts\2026-05-07_first-developers-meeting-clean.md`.
- Duplicate copies exist under `C:\Users\ender\.claude\projects\NorthstarHouse\Transcripts\2026-05-07_plaud-call\`.
- Existing triage sidecar confirmed the grants correction: `Port current pursued grants into Development Dashboard` is about surfacing the Plane grant list internally, not public grant-status copy.
- Transcript grounding for bat/doors:
  - `13:48 -> 13:58`: need fundraising/support/marketing for construction work to remove bat netting on second floor and get 12 basic doors.
  - `13:58 -> 14:06`: door work may also fit sponsorship/newsletter framing.
  - `14:06 -> 14:30`: bat issue should be researched as unusual grant/funding, not only historic preservation.
  - `14:30 -> 14:45`: safety frame: humans in facility may be subjected to something dangerous; doors could use sponsorship/in-kind route.

## Linear coverage check

- Linear plugin available.
- Natural-language research tool failed (`research not found`), so concrete list/search tools were used.
- Team confirmed: `Thenorthstarhouse`.
- Statuses: `Todo`, `In Progress`, `Done`, `Canceled`, `Backlog`, `Duplicate`.
- Existing labels: `Constant Contact`, `Email Campaign`, `Outreach`, `Membership`, `Improvement`, `Bug`, `Feature`.
- Existing grant/funding coverage found: none.
- Current Linear work is membership and sponsorship; no grant project or grant issues exist yet.

## Perplexity research artifacts

### USDA Community Facilities

- Perplexity URL: `https://www.perplexity.ai/search/93cd08d5-1541-464d-8e31-7667d26fe3d0`
- Advanced Research attempt hit account credit wall; normal Perplexity search completed with sources.
- Fit: uncertain-to-possible.
- Main gates:
  - Property-level USDA RD area eligibility must be checked first.
  - Grass Valley population under 20,000 helps, but USDA map controls.
  - Nonprofit eligibility appears structurally OK for a community-based nonprofit.
  - Museums are explicitly eligible community facility type.
  - Likely grant share is weak: Grass Valley likely at best a low grant tier; loan/hybrid may be more realistic than pure grant.
  - Bat safety, doors, accessibility, fire/life safety, and facility improvement can fit if framed as essential community facility improvements.
- Next actions:
  - Run exact North Star House property address through USDA RD eligibility map.
  - Call California USDA RD office.
  - Start SAM.gov/Login.gov/UEI only if the eligibility/repayment path remains plausible.
  - Gather 501(c)(3), bylaws, financials, board authorization, cost estimates, preliminary architectural feasibility, environmental review needs.
- Sources captured: USDA national CF page, USDA California CF page, USDA eligibility map, SAM.gov, Grants.gov, eCFR 7 CFR 3570, Federal Register FY2026 SECD notice, selected grant-guide sources.

### Bat netting / upstairs doors

- Perplexity URL: `https://www.perplexity.ai/search/5a540ed4-b9ba-4cde-86cd-a46e62beba3d`
- Deep Research completed enough to extract a usable issue brief.
- Frame: not just posted grants; pair health/safety bat exclusion with sponsorship/in-kind door package.
- Priority targets:
  - Walmart Spark Good Local Grant: $250-$5,000 per store, rolling, safety/community framing.
  - Home Depot Foundation Community Impact Grant: up to $5,000 in gift cards, volunteer implementation angle.
  - National Trust Preservation Funds: $2,500-$5,000, June 1, 2026; emergency/intervention inquiry may fit bat threat.
  - Hart Family Fund: $2,500-$15,000, but May 1, 2026 deadline likely passed; future/late-cycle check only.
  - Community Foundation of Nevada County: relationship-driven local ask, cycle unknown.
  - Nevada County Arts Council / CAC: urgent or next cycle; facility safety may fit operating support if arts/cultural frame is active.
  - Lowe's Community Partners / local store in-kind ask.
  - Rotary / Elks local civic support.
  - Habitat ReStore and local hardware/lumber suppliers for doors.
  - OSHA Susan Harwood and Cal OES HMGP are only worth pursuing with careful training/government-partner framing.
- Not worth prioritizing: Tractor Supply FFA grants, Lowe's Toolbox for Education, CDFA pest-control research grant unless a real research/education partner exists.

## Draft Linear payloads

Target Linear team: `Thenorthstarhouse`.

Project payload:

```json
{
  "name": "Grant Pipeline",
  "setTeams": ["Thenorthstarhouse"],
  "summary": "Organize current North Star grant opportunities, research gates, and funding routes recovered from Plane, dashboard tasks, transcripts, and Perplexity.",
  "description": "Execution layer for North Star grant and funding work recovered on 2026-05-12. Source systems: Plane workspace northstarhouse, live Development Dashboard grant tasks, 2026-05-07 developer meeting transcript, Perplexity research for USDA Community Facilities and bat netting/upstairs doors funding options. Supabase/Plane/GitHub/production dashboard remain read-only until separately approved.",
  "priority": 2,
  "state": "In Progress"
}
```

Issue payload batch:

| Title | Priority | Due | Description frame |
|---|---:|---|---|
| Port current pursued grants from Plane into Development Dashboard | 2 | 2026-05-17 | Parent/coordination issue; outcome is Linear project populated and dashboard handoff plan ready. |
| HER Grant Resubmission - recover reviewer comments and rebuild workplan | 2 | 2026-06-15 | $750K NPS HER resubmission; includes 20 recovered Plane work items. |
| Schwemm Family Foundation - define archive/interpreter project and draft application | 3 | 2026-06-14 | May 1-June 30 window; five recovered Plane next actions. |
| CA Arts Council GOS / Impact - verify missed deadline and fiscal-sponsor path | 2 | 2026-05-13 | Urgent status recovery; Eliza/NCAC sponsorship uncertain. |
| NEA Grants for Arts Projects - start federal registration path and museum fit research | 2 | 2026-05-20 | Intent July 9; SAM.gov/Login.gov/Grants.gov blocker. |
| Hind Foundation - find discrete restoration scope with deposited funds proof | 4 | null | Rolling, but blocked until project is funded enough and not soft-cost/capital-campaign work. |
| Long Foundation - research youth arts/education frame | 4 | 2026-06-15 | Fall cycle opens July 27; must not frame as preservation-only. |
| NEH Collections Stewardship - verify qualifying North Star collection | 4 | null | Deadline likely passed; preserve as future-cycle/collection gate. |
| NEH Media Projects - test Julia Morgan media concept | 3 | 2026-06-03 | June 25 deadline; needs realistic media deliverable and partners. |
| NTHP Preservation Fund - decide June 1 preservation planning application | 2 | 2026-05-18 | Small near-term preservation grant; bat emergency inquiry overlap. |
| NCA Cultural District Mini-Grants - research eligibility and cycle | 4 | 2026-05-24 | Local cultural district lead; source from Plane/Perplexity. |
| USDA Community Facilities - verify area eligibility and no-go/continue path | 2 | 2026-05-17 | Perplexity research says possible but gated by USDA map, CA RD call, and loan/grant realities. |
| Bat netting and 12 upstairs doors - pursue safety/in-kind funding routes | 2 | 2026-05-20 | Transcript-grounded; Perplexity targets Walmart, Home Depot, NTHP, COFONC, Lowe's, Rotary/Elks, Habitat ReStore. |

Exact Linear project and issue payloads are now prepared in `sidecars/grant-work-linear-payloads-2026-05-12.md`. Do not mutate Linear until the user approves that exact payload batch or requests a narrower batch.

## Open Design artifact

- OD health: OK.
- Web UI: `http://127.0.0.1:10507`.
- Daemon: `http://127.0.0.1:13116`.
- Project: `north-star-grant-pipeline-table-2026-05-12`.
- Artifact path: `C:\Users\ender\.claude\projects\OpenDesign\.od\projects\north-star-grant-pipeline-table-2026-05-12\index.html`.
- OD first generated a hallucinated generic table; corrected in-place with real recovered data and browser-verified via Chrome DevTools snapshot.

## Mutations performed

- Created local sidecar: `sidecars/grant-work-recovery-linear-port-2026-05-12.md`.
- Created local exact Linear payload proposal: `sidecars/grant-work-linear-payloads-2026-05-12.md`.
- Created local Open Design project/artifact: `C:\Users\ender\.claude\projects\OpenDesign\.od\projects\north-star-grant-pipeline-table-2026-05-12\index.html`.
- Created Linear project and issues after user advance approval for Linear writes. No Supabase, Plane, GitHub, or production dashboard mutations performed.

### Linear mutations - 2026-05-12

Project:

| ID | Name | URL |
|---|---|---|
| `e7423ef0-2d6e-467e-a68b-f2a349ff856a` | Grant Pipeline | https://linear.app/thenorthstarhouse/project/grant-pipeline-e9fbb00fa0d9 |

Issues:

| Identifier | Title | URL |
|---|---|---|
| `THE-18` | Port current pursued grants from Plane into Development Dashboard | https://linear.app/thenorthstarhouse/issue/THE-18/port-current-pursued-grants-from-plane-into-development-dashboard |
| `THE-19` | HER Grant Resubmission - recover reviewer comments and rebuild workplan | https://linear.app/thenorthstarhouse/issue/THE-19/her-grant-resubmission-recover-reviewer-comments-and-rebuild-workplan |
| `THE-20` | Schwemm Family Foundation - define archive or interpreter project and draft application | https://linear.app/thenorthstarhouse/issue/THE-20/schwemm-family-foundation-define-archive-or-interpreter-project-and |
| `THE-21` | CA Arts Council GOS and Impact Projects - verify missed deadline and fiscal-sponsor path | https://linear.app/thenorthstarhouse/issue/THE-21/ca-arts-council-gos-and-impact-projects-verify-missed-deadline-and |
| `THE-22` | NEA Grants for Arts Projects - start federal registration path and museum fit research | https://linear.app/thenorthstarhouse/issue/THE-22/nea-grants-for-arts-projects-start-federal-registration-path-and |
| `THE-23` | Hind Foundation - find discrete restoration scope with deposited funds proof | https://linear.app/thenorthstarhouse/issue/THE-23/hind-foundation-find-discrete-restoration-scope-with-deposited-funds |
| `THE-24` | Long Foundation - research youth arts or education frame | https://linear.app/thenorthstarhouse/issue/THE-24/long-foundation-research-youth-arts-or-education-frame |
| `THE-25` | NEH Media Projects - test Julia Morgan media concept | https://linear.app/thenorthstarhouse/issue/THE-25/neh-media-projects-test-julia-morgan-media-concept |
| `THE-26` | NEH Collections Stewardship - verify qualifying North Star collection | https://linear.app/thenorthstarhouse/issue/THE-26/neh-collections-stewardship-verify-qualifying-north-star-collection |
| `THE-27` | NTHP Preservation Fund - decide June 1 preservation planning application | https://linear.app/thenorthstarhouse/issue/THE-27/nthp-preservation-fund-decide-june-1-preservation-planning-application |
| `THE-28` | NCA Cultural District Mini-Grants - research eligibility and cycle | https://linear.app/thenorthstarhouse/issue/THE-28/nca-cultural-district-mini-grants-research-eligibility-and-cycle |
| `THE-29` | USDA Community Facilities - verify area eligibility and no-go or continue path | https://linear.app/thenorthstarhouse/issue/THE-29/usda-community-facilities-verify-area-eligibility-and-no-go-or |
| `THE-30` | Bat netting and 12 upstairs doors - pursue safety and in-kind funding routes | https://linear.app/thenorthstarhouse/issue/THE-30/bat-netting-and-12-upstairs-doors-pursue-safety-and-in-kind-funding |

Verification:

- Linear project readback found one `Grant Pipeline` project with ID `e7423ef0-2d6e-467e-a68b-f2a349ff856a`.
- Linear issue readback for project `Grant Pipeline` returned 13 issues, `THE-18` through `THE-30`.
- Child issues `THE-19` through `THE-30` have parent `THE-18`.
- USDA and bat/doors issues include live dashboard and Perplexity links.

## Pending dashboard update proposals

| Task | Proposed change | Reason | Status |
|---|---|---|---|
| Port current pursued grants into Development Dashboard | Add note/comment after Linear/OD batch is approved: Plane inventory recovered, OD table created, Linear Grant Pipeline proposed. | Existing task is due and now has concrete artifact/results. | pending |
| Research USDA Community Facilities grant fit | Add note/comment with Perplexity fit summary and next actions; optionally keep as dashboard task until USDA map checked. | Fit is not resolved until property-level USDA eligibility and CA RD call. | pending |
| Research funding options for bat netting and upstairs doors | Add note/comment with transcript grounding and prioritized funding routes. | Research now separates likely local/in-kind paths from weak/non-priority grants. | pending |

## Local dashboard MVP - 2026-05-12

Implemented a local code-only grants dashboard route. This did not write Supabase, Plane, GitHub, or production dashboard data.

Files changed:

- `lib/grant-pipeline.ts` - static recovered grant/funding data, Linear URLs, next actions, blockers, fit notes, and sources.
- `app/grants/page.tsx` - dashboard-native Grant Pipeline view with metrics, filters, search, table rows, and next-step links.
- `components/Sidebar.tsx` - added Grants navigation item.
- `app/page.tsx` - linked the Fund Development `Grants` overview tile to `/grants/`.

Verification:

- `npx eslint app/grants/page.tsx lib/grant-pipeline.ts` passed.
- `npm run build` passed and exported route `/grants`.
- `http://localhost:4000/north-star-donors/grants/` returned HTTP 200 with `Grant Pipeline` and `USDA Community Facilities` content.
- Chrome DevTools render check found the Grants nav item, metrics, all 12 displayed grant/funding rows, Linear issue links, and no console errors.

Known verification note:

- Full-repo `npm run lint` still fails on pre-existing unrelated lint issues and generated sandbox `.next` files. The changed grants route/data module lint cleanly.
