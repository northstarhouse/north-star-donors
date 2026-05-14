# Grant Work Linear Payloads - 2026-05-12

Status: prepared for approval. No Linear writes have been run from this payload file.

Target:
- Workspace/team: Thenorthstarhouse
- Team key: THE
- Existing project check: no Grant Pipeline project found on 2026-05-12
- Available statuses: Todo, In Progress, Backlog, Done, Canceled, Duplicate
- Available labels: Outreach, Improvement, Feature, Bug, Membership, Email Campaign, Constant Contact

Write order:
1. Create project `Grant Pipeline`.
2. Create parent issue `Port current pursued grants from Plane into Development Dashboard`.
3. Create the twelve grant/funding work issues under `Grant Pipeline`.
4. If Linear returns the parent issue identifier, optionally set it as parent for the twelve work issues in a second pass.

## Project Payload

Tool: `mcp__codex_apps__linear._save_project`

```json
{
  "name": "Grant Pipeline",
  "setTeams": ["Thenorthstarhouse"],
  "summary": "Organize current North Star grant opportunities, research gates, and funding routes recovered from Plane, dashboard tasks, transcripts, and Perplexity.",
  "description": "Execution layer for North Star grant and funding work recovered on 2026-05-12.\n\nSources:\n- Plane workspace `northstarhouse`: 11 grant projects and 35 work items recovered.\n- Live Development Dashboard tasks: USDA Community Facilities fit, bat netting/upstairs doors funding, and port current pursued grants.\n- 2026-05-07 developer meeting clean transcript.\n- Perplexity research for USDA Community Facilities and bat netting/upstairs doors.\n- OD artifact: C:\\Users\\ender\\.claude\\projects\\OpenDesign\\.od\\projects\\north-star-grant-pipeline-table-2026-05-12\\index.html\n\nGuardrails:\n- Supabase, Plane, GitHub, and production dashboard stay read-only until separately approved.\n- This Linear project is the working execution layer before any sandbox/dashboard promotion.",
  "priority": 2,
  "state": "In Progress",
  "startDate": "2026-05-12",
  "color": "#2563EB",
  "icon": ":seedling:"
}
```

## Issue Payloads

### 1. Port current pursued grants from Plane into Development Dashboard

Tool: `mcp__codex_apps__linear._save_issue`

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "Port current pursued grants from Plane into Development Dashboard",
  "state": "In Progress",
  "priority": 2,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-05-18",
  "labels": ["Feature"],
  "links": [
    {
      "title": "Live dashboard task",
      "url": "https://northstarhouse.github.io/north-star-donors/task/?taskId=1358d1dc-9281-4c48-a45a-4b9d303d7c59"
    }
  ],
  "description": "## Outcome\nCurrent pursued grants recovered from Plane are represented in Linear and ready for dashboard/sandbox handoff.\n\n## Current findings\n- Plane has 11 grant projects and 35 work items.\n- Live dashboard has a matching grant-port task but no detailed inventory.\n- Linear had no grant coverage before this recovery pass.\n- OD MVP grant table exists at `C:\\Users\\ender\\.claude\\projects\\OpenDesign\\.od\\projects\\north-star-grant-pipeline-table-2026-05-12\\index.html`.\n\n## Next action\nUse the Linear Grant Pipeline issues as the source of truth for the first dashboard MVP table. After approval, port the table and issue links into sandbox before any production dashboard change.\n\n## Blockers\n- Dashboard/Supabase write approval.\n- Decision on whether the first dashboard surface should show every recovered grant or only active/high-likelihood grants.\n\n## Acceptance criteria\n- All 11 recovered Plane grant projects are represented in Linear.\n- USDA Community Facilities and bat netting/upstairs doors research have robust standalone issues.\n- OD table is linked from the working record.\n- Sandbox/dashboard update proposal is ready with sources, blockers, next actions, and due dates."
}
```

### 2. HER Grant Resubmission - recover reviewer comments and rebuild workplan

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "HER Grant Resubmission - recover reviewer comments and rebuild workplan",
  "state": "Todo",
  "priority": 2,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-06-15",
  "description": "## Outcome\nThe History of Equal Rights resubmission path is rebuilt from the prior application, reviewer feedback, and remaining Plane work items.\n\n## Source context\n- Plane project: `HER Grant Resubmission`.\n- Amount: about $750,000.\n- Deadline: 2026-09-30.\n- Plane work items recovered: 20.\n- Known work includes reviewer comments, SHPO materials, 2023 budget, historic photos, PDFs, narratives, forms, and grants.gov submission.\n\n## Next action\nRecover the reviewer comments and prior 23-file application package, then map each Plane work item into either done, blocked, or next-action status.\n\n## Blockers\n- Reviewer comments not yet recovered.\n- Original application package location needs confirmation.\n- SHPO letter/status needs confirmation.\n\n## Acceptance criteria\n- Reviewer comments and prior application package are linked or summarized.\n- Reuse/new-work split is clear.\n- Budget, narrative, forms, attachments, and submission tasks are either converted to child issues or explicitly marked unnecessary.\n- Timeline works backward from 2026-09-30."
}
```

### 3. Schwemm Family Foundation - define archive or interpreter project and draft application

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "Schwemm Family Foundation - define archive or interpreter project and draft application",
  "state": "Todo",
  "priority": 3,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-06-01",
  "description": "## Outcome\nNorth Star has a concrete Schwemm application concept and enough application detail to decide whether to submit before the 2026 window closes.\n\n## Source context\n- Plane project: `Schwemm Family Foundation`.\n- Amount: about $8,000.\n- Window: 2026-05-01 to 2026-06-30.\n- Plane work items recovered: 5.\n- Fit noted in Plane: archives, interpretive signage, or docent program.\n\n## Next action\nRecover/download the current application instructions and choose one focused scope: archive supplies/digitization, interpretive signage, or docent/interpreter support.\n\n## Blockers\n- Current application details and required attachments need confirmation.\n- Scope owner and budget not chosen.\n\n## Acceptance criteria\n- Current guidelines are attached or summarized.\n- One project scope is selected with rough budget.\n- Application requirements are translated into a submission checklist.\n- Submit/no-submit decision is made before 2026-06-15."
}
```

### 4. CA Arts Council GOS and Impact Projects - verify missed deadline and fiscal-sponsor path

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "CA Arts Council GOS and Impact Projects - verify missed deadline and fiscal-sponsor path",
  "state": "Todo",
  "priority": 2,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-05-15",
  "description": "## Outcome\nNorth Star knows whether the 2026 CA Arts Council opportunities are missed, submitted elsewhere, salvageable, or should become next-cycle/fiscal-sponsor work.\n\n## Source context\n- Plane projects: `CA Arts Council GOS` and `CA Arts Council Impact Projects`.\n- Amount: up to $25,000 each.\n- Deadline noted in Plane: 2026-05-12.\n- Fiscal sponsorship via Nevada County Arts Council was flagged.\n- User context: fiscal sponsorship may be uncertain because Eliza is stepping down.\n\n## Next action\nVerify exact 2026 deadline status and whether NCAC or another sponsor can still support any current or next-cycle application.\n\n## Blockers\n- Deadline may have passed on 2026-05-12.\n- Fiscal sponsor status unclear.\n- Program eligibility may depend on arts/cultural programming frame, not preservation alone.\n\n## Acceptance criteria\n- Deadline and submission status are confirmed.\n- Sponsor path is named or ruled out.\n- If missed, next-cycle tracking and relationship steps are recorded.\n- If still viable, required narrative, budget, and sponsor tasks are listed."
}
```

### 5. NEA Grants for Arts Projects - start federal registration path and museum fit research

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "NEA Grants for Arts Projects - start federal registration path and museum fit research",
  "state": "Todo",
  "priority": 3,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-06-15",
  "description": "## Outcome\nNorth Star has a clear go/no-go for NEA Grants for Arts Projects and knows whether federal registration work must start immediately.\n\n## Source context\n- Plane project: `NEA Grants for Arts Projects`.\n- Amount: $10,000 to $100,000.\n- Intent/application date noted in Plane: 2026-07-09.\n- Plane work items recovered: 5.\n- Known gates: SAM.gov, Login.gov, Grants.gov, museum/arts fit.\n\n## Next action\nCheck SAM.gov/Login.gov/Grants.gov status and research the strongest museum or arts-program frame for North Star.\n\n## Blockers\n- Federal registration can take time.\n- Need a strong arts-program deliverable, not just building preservation.\n- Match/cash requirements need confirmation.\n\n## Acceptance criteria\n- Federal registration status is documented.\n- Program fit and eligible project type are summarized with source links.\n- Match/cash requirement is known.\n- Submit/no-submit decision target is set before 2026-06-30."
}
```

### 6. Hind Foundation - find discrete restoration scope with deposited funds proof

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "Hind Foundation - find discrete restoration scope with deposited funds proof",
  "state": "Backlog",
  "priority": 3,
  "assignee": "Kaelen Jennings",
  "description": "## Outcome\nNorth Star knows whether a Hind Foundation request can be made around a discrete restoration scope with required funds already deposited.\n\n## Source context\n- Plane project: `Hind Foundation`.\n- Amount: $10,000 to $50,000.\n- Deadline: rolling.\n- Plane notes flagged proof of deposited funds and restrictions.\n\n## Next action\nAsk finance/board for candidate projects and whether deposited matching/project funds can be documented.\n\n## Blockers\n- Proof of deposited funds may be required.\n- Project restrictions and eligible cost categories need confirmation.\n- No Plane work items existed yet.\n\n## Acceptance criteria\n- Current Hind guidelines are summarized.\n- Candidate restoration scope and budget are identified or ruled out.\n- Deposited-funds proof requirement is answered.\n- If viable, draft application checklist is created."
}
```

### 7. Long Foundation - research youth arts or education frame

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "Long Foundation - research youth arts or education frame",
  "state": "Backlog",
  "priority": 4,
  "assignee": "Kaelen Jennings",
  "description": "## Outcome\nNorth Star knows whether Long Foundation is worth pursuing through a youth arts, education, or interpretation angle.\n\n## Source context\n- Plane project: `Long Foundation`.\n- Amount: $10,000 to $40,000 first-time.\n- Fall cycle opens around 2026-07-27.\n- Plane fit note: youth arts/education, not pure preservation.\n\n## Next action\nResearch current cycle requirements and identify whether North Star has a credible youth/education deliverable.\n\n## Blockers\n- Program fit may be weak if framed as preservation only.\n- No current youth program scope is documented in this recovery pass.\n\n## Acceptance criteria\n- Current guidelines and cycle dates are linked.\n- Youth/education fit is rated strong, possible, or weak.\n- If possible, one concrete project concept and partner need are named.\n- If weak, issue is marked no-go with rationale."
}
```

### 8. NEH Collections Stewardship - verify qualifying North Star collection

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "NEH Collections Stewardship - verify qualifying North Star collection",
  "state": "Backlog",
  "priority": 4,
  "assignee": "Kaelen Jennings",
  "description": "## Outcome\nNorth Star knows whether it has a qualifying humanities collection for a future NEH Collections Stewardship application.\n\n## Source context\n- Plane project: `NEH Collections Stewardship`.\n- Deadline noted in Plane: 2026-05-11.\n- Fit gate: verify qualifying collection.\n- No Plane work items existed yet.\n\n## Next action\nAsk Haley/archives owner what collections exist, where they live, and whether preservation/access work is needed.\n\n## Blockers\n- 2026-05-11 deadline appears passed.\n- Qualifying collection is unverified.\n- Need collection owner, inventory, and preservation/access need.\n\n## Acceptance criteria\n- Current/future NEH cycle status is documented.\n- Collection existence and ownership are confirmed or ruled out.\n- If viable, eligible project activities and required partners are listed.\n- If not viable, no-go rationale is recorded."
}
```

### 9. NEH Media Projects - test Julia Morgan media concept

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "NEH Media Projects - test Julia Morgan media concept",
  "state": "Backlog",
  "priority": 4,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-06-01",
  "description": "## Outcome\nNorth Star knows whether the Julia Morgan / North Star story can support an NEH Media Projects concept before the noted June 2026 deadline.\n\n## Source context\n- Plane project: `NEH Media Projects`.\n- Deadline noted in Plane: 2026-06-25.\n- Fit note: Julia Morgan media angle.\n- No Plane work items existed yet.\n\n## Next action\nConfirm eligible media formats, required humanities framing, and whether a credible media partner or producer exists.\n\n## Blockers\n- Media partner/producer not identified.\n- Humanities framing and audience plan need research.\n- Timeline may be too short for a competitive 2026 submission.\n\n## Acceptance criteria\n- Current guidelines and deadline are linked.\n- Media concept is stated in one paragraph.\n- Required partner, budget, and production plan gaps are listed.\n- Submit/no-submit decision is made before 2026-06-10."
}
```

### 10. NTHP Preservation Fund - decide June 1 preservation planning application

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "NTHP Preservation Fund - decide June 1 preservation planning application",
  "state": "Todo",
  "priority": 2,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-05-20",
  "description": "## Outcome\nNorth Star decides whether to pursue the June 1 NTHP Preservation Fund cycle and knows whether PLF membership or another eligibility step is required.\n\n## Source context\n- Plane project: `NTHP Preservation Fund`.\n- Amount: $2,500 to $5,000.\n- Deadline noted in Plane: 2026-06-01.\n- Plane note: PLF membership required to receive funds.\n\n## Next action\nEmail or call NTHP/Saving Places to confirm eligibility, deadline, and whether a planning/consultant scope fits.\n\n## Blockers\n- PLF membership or affiliation requirement needs confirmation.\n- Scope must likely be planning/consultant/professional service, not general construction.\n- Short timeline to 2026-06-01.\n\n## Acceptance criteria\n- Eligibility and membership requirement are confirmed.\n- A narrow preservation planning scope is selected or ruled out.\n- Required match/attachments are listed.\n- Submit/no-submit decision is made by 2026-05-20."
}
```

### 11. NCA Cultural District Mini-Grants - research eligibility and cycle

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "NCA Cultural District Mini-Grants - research eligibility and cycle",
  "state": "Todo",
  "priority": 3,
  "assignee": "Kaelen Jennings",
  "description": "## Outcome\nNorth Star knows whether Nevada County Arts Council / Grass Valley-Nevada City cultural district mini-grants are available and worth pursuing.\n\n## Source context\n- Plane project: `NCA Cultural District Mini-Grants`.\n- Plane note: NCA/GVNC mini-grants; eligibility and cycle unknown.\n- No Plane work items existed yet.\n\n## Next action\nFind current NCAC/GVNC mini-grant contacts, cycle timing, eligibility, and typical award amount.\n\n## Blockers\n- Current cycle unknown.\n- Eligibility may depend on cultural district geography, fiscal sponsor relationship, or arts programming.\n\n## Acceptance criteria\n- Current program owner/contact is identified.\n- Cycle date and application path are known or confirmed inactive.\n- Fit is rated strong, possible, or weak.\n- If viable, next outreach/application step is named."
}
```

### 12. USDA Community Facilities - verify area eligibility and no-go or continue path

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "USDA Community Facilities - verify area eligibility and no-go or continue path",
  "state": "Todo",
  "priority": 2,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-05-17",
  "links": [
    {
      "title": "Live dashboard task",
      "url": "https://northstarhouse.github.io/north-star-donors/task/?taskId=4f1bf813-3560-4f6e-9fad-0f1af40d0876"
    },
    {
      "title": "Perplexity research thread",
      "url": "https://www.perplexity.ai/search/93cd08d5-1541-464d-8e31-7667d26fe3d0"
    },
    {
      "title": "USDA Community Facilities Direct Loan and Grant Program",
      "url": "https://www.rd.usda.gov/programs-services/community-facilities/community-facilities-direct-loan-grant-program"
    }
  ],
  "description": "## Outcome\nNorth Star gets a clear no-go/continue decision for USDA Community Facilities before investing application labor.\n\n## Research finding\nPerplexity research rates fit as uncertain-to-possible. The nonprofit/community-facility/museum frame may fit, but the hard gates are property eligibility, USDA Rural Development review, repayment/commercial-credit requirements, and likely low grant percentage. A loan or loan/grant mix is more realistic than a pure grant.\n\n## Next action\nRun the exact North Star property address through the USDA eligibility map, then call California USDA Rural Development with a short fact pattern: 501(c)(3), historic house/museum/community facility, needed safety/accessibility/building-envelope work, and likely project range.\n\n## Blockers\n- Exact property eligibility must be verified by USDA map/RD staff.\n- Need to know whether North Star can take debt or show repayment capacity.\n- Need documentation that credit is unavailable at reasonable commercial rates.\n- Grant-only path likely weak.\n\n## Acceptance criteria\n- Eligibility-map result is captured.\n- California USDA RD response is summarized.\n- Eligible cost categories are confirmed for doors, safety/accessibility, building envelope, and any bat-related remediation.\n- Board-level debt/grant appetite is named.\n- Issue ends with continue, pause, or no-go decision."
}
```

### 13. Bat netting and 12 upstairs doors - pursue safety and in-kind funding routes

```json
{
  "team": "Thenorthstarhouse",
  "project": "Grant Pipeline",
  "title": "Bat netting and 12 upstairs doors - pursue safety and in-kind funding routes",
  "state": "Todo",
  "priority": 2,
  "assignee": "Kaelen Jennings",
  "dueDate": "2026-05-24",
  "labels": ["Outreach"],
  "links": [
    {
      "title": "Live dashboard task",
      "url": "https://northstarhouse.github.io/north-star-donors/task/?taskId=55b3f2e7-5426-4299-b0cc-d304b02c715d"
    },
    {
      "title": "Perplexity research thread",
      "url": "https://www.perplexity.ai/search/5a540ed4-b9ba-4cde-86cd-a46e62beba3d"
    }
  ],
  "description": "## Outcome\nNorth Star has a practical funding and in-kind outreach route for removing second-floor bat netting and installing 12 basic upstairs doors.\n\n## Transcript grounding\nThe 2026-05-07 developer meeting described construction work to remove bat netting on the second floor and a need for 12 basic upstairs doors. The discussion framed doors as sponsor/newsletter/in-kind friendly and bats as a possible worker-safety or public-health angle, not necessarily a normal posted grant.\n\n## Research finding\nPerplexity research suggests a $15,000-$55,000 cash target plus $3,000-$10,000 in-kind target. Highest-priority routes are local/business/civic and small preservation grants: Walmart Spark Good, Home Depot Foundation Community Impact, Lowe's/local store support, NTHP Preservation Fund, Community Foundation of Nevada County, Nevada County Arts Council/CA Arts Council if a cultural/safety frame fits, Rotary/Elks/local civic groups, Habitat ReStore, and local hardware/lumber suppliers. OSHA/Cal OES style routes are possible only with a real worker-safety training or county emergency-management partner.\n\n## Next action\nCreate a one-page ask packet with photos, itemized door count/specs, bat-netting safety rationale, cost estimate, nonprofit status, and recognition offer. Start with Walmart/Home Depot/Lowe's/local civic asks while preserving NTHP as a possible June 1 planning/safety application.\n\n## Blockers\n- Need actual contractor or materials quote.\n- Need basic door specs and whether labor is volunteer, contractor, or in-kind.\n- Need bat/remediation framing that is accurate and not overclaiming public-health risk.\n- Need owner for local outreach.\n\n## Acceptance criteria\n- Door and bat-netting cost estimate is attached.\n- One-page ask packet exists.\n- First five outreach targets are named with owner and ask amount/type.\n- NTHP/CFONC/NCAC route is either pursued or ruled out with reason.\n- Dashboard task can show concrete next action other than generic research."
}
```

## Sidecar Mutation Note

If approved and executed, append results to:

`C:\Users\ender\.claude\projects\north-star-donors-gh\sidecars\grant-work-recovery-linear-port-2026-05-12.md`

Required result fields:
- Linear project URL and ID.
- Each created issue identifier and URL.
- Any failed write and retry decision.
- Confirmation that no Supabase, Plane, GitHub, or production dashboard mutation occurred.
