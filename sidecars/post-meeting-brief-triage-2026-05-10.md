# Drilldown sidecar - Post-meeting brief triage
Date: 2026-05-10
Parent task: Triage May 7 post-meeting brief contents
Session ceiling: Classify brief claims as signal or noise before anything becomes dashboard truth.

## Operating rule for continuing DDD

- This file is the canonical sidecar for the overall May 7 post-meeting brief triage.
- Continue using it to track the main brief-triage queue, classifications, dashboard cross-checks, and final outcomes.
- If a triage item turns into a deep rabbit hole, create a separate drilldown sidecar for that rabbit-hole session.
- Do not fill the canonical sidecar with live rabbit-hole detail while the rabbit hole is unfolding.
- When a rabbit-hole drilldown reaches a result, summarize the result back into this canonical sidecar only as it affects the main brief triage: classification, blocker, proposed dashboard update, no-op decision, or next step.
- Keep `Pending dashboard update proposals` as the end-gate queue. Do not mutate the live dashboard during exploration unless the user explicitly approves that gate.

## Open todos

* Identify source material ✓
  - Likely transcript: `C:\Users\ender\.claude\projects\Vault\data\transcripts\2026-05-07_first-developers-meeting-clean.md`
  - Brief under review: `C:\Users\ender\.claude\projects\north-star-donors-gh\public\briefs\post-meeting-brief.html`
* Extract candidate claims from the brief ✓
  - Sponsor packet tier ladder / Presenting sponsor pricing.
  - Membership email remainder blocked by sender infrastructure.
  - Outreach mailbox / Constant Contact sender verification.
  - Derek onboarding and sponsor outreach lane.
  - Empire Mine school-lunch partnership idea.
  - Nisenan Arts Gallery / Arts Council intro.
  - Website grant-status update.
  - Arts Council fiscal sponsorship / Gianna.
  - Bat netting plus upstairs doors grant/sponsorship angle.
  - June magician/event defer question.
  - Mother's Day follow-up.
* Test candidate claims against transcript only where it affects triage
  - First keyword pass found transcript anchors for most claims.
  - Anchor does not equal task. Several claims are likely context unless owner/action pressure appears.
* Classify each candidate as confirmed task, open question, context, or drop/noise ✓
  - Confirmed task / blocker: fix sponsor tier ladder before packet leaves.
  - Confirmed task / blocker: create or choose campaign sender address and verify it in Constant Contact.
  - Confirmed task / blocker: send remaining membership email only after sender path works.
  - Open question: what exact Derek account/role is needed: named mailbox, sponsorship mailbox, Workspace admin, or app access?
  - Open question: June magician event - commit now or defer and use flyer for next year?
  - Context / research: Empire Mine school-lunch idea; transcript supports idea, not clear owner. Derek linkage is illustrative only, not official.
  - Context / possible future task: Nisenan Arts Gallery / Arts Council intro; transcript supports topic, not clear owner.
  - Context / dependency: Arts Council fiscal sponsorship / Gianna; useful fact, not a task by itself.
  - Context / strategy: bat netting plus upstairs doors; plausible grant/sponsor angle, not a task without owner/artifact.
  - Context / possible future task: public grant-status website update; needs proof of explicit ask or owner.
  - Context / possible future task: Mother's Day follow-up; sold out is real, survey/follow-up needs stronger task evidence.

## Notes / observations

- The brief is untrusted AI synthesis and may have been generated from a messy transcript.
- Transcript evidence proves a claim was said; it does not prove the claim should become a task.
- Site/source evidence is a separate gate. Before suggesting dashboard work, check what the actual site/app/Haley-facing source already says so we do not create duplicate or stale tasks.
- Task-worthiness requires action pressure: owner, next action, blocker, deadline, external dependency, or decision needed.
- Ideas without a clear owner are not killed. Save as context/research in the sidecar, tag them, and only roll them into a task when they attach to a real owner or artifact.
- Context can later roll into a broader owner/outreach task only if ownership is confirmed.
- Triage row format going forward: brief claim, site/source status, possible todo, validation question.
- Active rabbit hole: investigate Haley's IONOS/server access + Resend backend comment because it may change whether membership-email blockers belong to Constant Contact, Dev Dashboard, reply monitoring, or sender-access tasks.
- Team-facing copy rule: dashboard wording must be written for Haley/dev-team readers, not as Codex investigation notes. Titles should be short, concrete, and recognizable from the team's work. Do not propose verbose comments, tool logs, or meta-language like "do not treat X as Y" unless the user explicitly asks for that exact note.

## Triage sheet

| Item | Bucket | Tags | Evidence read | Handling |
|---|---|---|---|---|
| Sponsor tier ladder | Task / blocker | `task`, `blocker`, `sponsorship` | Transcript supports tier revision and need to include wider/higher tiers. | Keep as real work. Needs final tier decision before packet ships. |
| Membership email remainder | Existing work / segmented campaign | `task`, `membership`, `email`, `existing-dashboard-task` | Dashboard has in-progress task: "Send Long-Lapsed Email-Only Renewal to 11 recipients." User clarified this covers only the 11 long-lapsed contacts without physical addresses, not the whole campaign. | Do not create a duplicate broad "send remaining membership email" task. Treat this as one campaign segment. Cross-check other campaign segments before proposing additional sends. |
| Campaign sender / mailbox | Existing task / blocker | `task`, `blocker`, `email`, `infrastructure`, `existing-dashboard-task` | Dashboard has in-progress task: "Making info@ able to send emails through Dev Dashboard." Transcript supports creating an email and adding it as a Constant Contact verified sender for membership emails. | Do not create a new task. Map brief claim to existing dashboard task; check whether info@ is already created/verified before changing status. |
| Derek access / role | Open question | `open-question`, `onboarding`, `sponsorship` | Transcript supports Derek vs sponsorship mailbox question. Admin/app role is not yet cleanly proven. | Ask/verify exact access needed before tasking. |
| Empire Mine school-lunch idea | Follow-up / check-in candidate | `open-question`, `partnerships`, `education`, `tracking` | Transcript supports Empire Mine as a partnership lane and school-lunch idea. User believes Derek may be meeting Empire Mine this week, but transcript evidence found so far does not cleanly confirm Derek owns it. | Track as a lightweight check-in candidate, not a fully scoped task. |
| Nisenan Arts Gallery / Arts Council intro | Context / relationship dependency | `context`, `relationship`, `partnerships`, `arts-council` | Transcript supports Nisenan/gallery topic and Arts Council adjacency. User added that Kaelen may need to make progress on the Arts Council cultural-asset mirror before reaching out on North Star items. | Preserve as relationship/context; do not force task until approach timing is right. |
| Grant-status website update | Possible task / needs validation | `open-question`, `grants`, `website` | Transcript supports grant submitted and site update not done. Owner/urgency unclear. | Validate whether this is an actual deliverable or just status context. |
| Arts Council fiscal sponsorship / Gianna | Rabbit-hole candidate / dependency | `context`, `dependency`, `grants`, `arts-council`, `rabbit-hole-candidate` | Transcript supports fiscal sponsorship requirement and Gianna conversation. User flagged this likely needs its own drilldown before tasking. | Preserve as dependency fact; do not dashboard-task from basic pass. Open separate drilldown if fiscal sponsorship becomes active blocker. |
| Bat netting + upstairs doors | Research task candidate | `research`, `grants`, `sponsorship`, `facilities` | Transcript supports looking beyond standard grant sources, including Walmart/community/tax-break style opportunities, plus bat-safety grant framing and 12-door sponsorship angle. | Promote as a research candidate, scoped around unusual/local/corporate/in-kind funding sources. |
| June magician event | Open decision | `open-question`, `event`, `decision` | Transcript supports hard-to-coordinate magician/event thread and flyer/next-year language. | Needs go/defer decision before tasking. |
| Mother's Day follow-up | Research / decision candidate | `research`, `event`, `email-permission`, `audience` | Transcript supports the actual nuance: all attendee emails may exist, but permission to email is unclear; possible post-event survey/follow-up needs policy/permission thinking. | Reframe from "send follow-up" to "decide/research whether and how event follow-up is allowed." |

## Dashboard cross-check

Live dashboard read on 2026-05-10 from Supabase `tasks` with joined `initiatives`.
Earlier DOM read is visual confirmation only; Supabase is canonical.

Fresh baseline read: 2026-05-10T16:44:18Z using `C:\Users\ender\.claude\.env` Supabase credentials, not browser tokens. Snapshot: `sidecars/ddd-dashboard-baseline-2026-05-10.json`.

Resumed drilldown: 2026-05-11T00:20:42Z against the safe sandbox mirror backend (`pasamzrwwaqhiwkixpbt`) served at `http://localhost:4001/north-star-donors/`. Mirror task snapshot matches the expected dashboard shape: 13 tasks, 6 comments, counts `todo: 6`, `in_progress: 3`, `done: 4`. Use sandbox for exploratory UI testing; do not mutate live dashboard rows during triage.

Current counts:

- `todo`: 6
- `in_progress`: 3
- `done`: 4
- task comments: 6

Baseline notes:

- `Making info@ able to send emails through Dev Dashboard` is `in_progress`, `Technical`, owner `Haley`, comments `1`, notes present.
- `Define reply monitoring plan for membership emails` is `todo`, `Decision`, comments `2`, notes present.
- `Confirm Constant Contact sender address` is `todo`, `Decision`, comments `0`, notes present.
- `Send Long-Lapsed Email-Only Renewal to 11 recipients` remains `in_progress`, owner `Kaelen`, due `2026-05-11`, notes present.
- `Draft sponsor packet v2` remains `in_progress`, `Decision`, comments `1`, notes present.

### To Do

- Grant Potential: USDA Community Facilities Direct Loan & Grant Program 11 — `Research`
- Define reply monitoring plan for membership emails — `Decision`, `Membership`, `Membership Email Campaign`
- Build Touch 1 draft campaigns in Constant Contact — `Technical`, `Membership`, `Membership Email Campaign`
- Confirm membership email audience groups — `Decision`, `Membership`, `Membership Email Campaign`
- Confirm Constant Contact sender address — `Decision`, `Membership`, `Membership Email Campaign`
- Historic Blog Posting — `Blog Post`

### In Progress

- Draft sponsor packet v2 — `Decision`, `Sponsorships`, `Sponsorship Plan`, attachment
  - DB notes: board-review tier structure draft is ready; review/approve board-facing tier structure; audit sponsor packet v1 perks; then draft sponsor-facing Sponsor Packet V2.
- Making info@ able to send emails through Dev Dashboard — `Technical`, `Haley`, in progress
- Send Long-Lapsed Email-Only Renewal to 11 recipients — `Other`, `Membership`, `Recently Lapsed Member Letter`, owner `Kaelen`, due May 11
  - DB notes: Touch 1 for 11 long-lapsed donors who could not receive the physical letter but had emails recovered through Constant Contact. Gate: spot-check name matches, confirm sender/reply address, get Haley comfortable before sending. DKIM is not treated as blocker for this small send.

### Done

- Review Touch 1 email drafts — `Editing`, `Membership`, `Membership Email Campaign`, owner `Haley`
- Edit/Proof Read Recently Lapsed Members Letter — `Editing`, `Membership`, `Recently Lapsed Member Letter`, due Apr 28, attachment
- Set up membership mail merge — `Technical`, `Membership`, `Recently Lapsed Member Letter`, due Apr 28
- Picking up print from House of Print & Copy — `Other`, owner `Haley`, due Apr 23

### Supabase task notes that affect triage

- `Build Touch 1 draft campaigns in Constant Contact`: drafts created/staged for Warm, Cold, and Brick Buyers. Do not schedule/send until sender, audience, and draft review tasks are approved. Sendable counts: Warm 85, Cold 36, Brick Buyers 27; six contacts already unsubscribed.
- `Confirm membership email audience groups`: review Warm, Cold, and Brick Buyers before scheduling first sends; do not resubscribe contacts unless explicitly asked.
- `Confirm Constant Contact sender address`: decide sender address/display name and reply destination.
- `Define reply monitoring plan for membership emails`: decide who checks reply-to inbox, cadence, escalation, logging, and suppression for later touches.
- `task_comments` read after DDD correction:
  - `Define reply monitoring plan for membership emails`: "I believe we decided this would be info@thenorthstarhouse.org but I can't currently log in to it"
  - `Define reply monitoring plan for membership emails`: Haley later commented "Just fixed this"
  - `Making info@ able to send emails through Dev Dashboard`: "IONOS is processing the server access.. using Resend as the backend for this. Created list section for each volunteer sector."

### Current DDD read

| Brief claim | Dashboard match | Status | Proposed handling | Validation question |
|---|---|---|---|---|
| Membership email campaign needs sender path before send. | `Making info@ able to send emails through Dev Dashboard`; `Confirm Constant Contact sender address`; task comments on reply monitoring | In progress + To Do | Merge into existing / update status only | Is IONOS/server access still processing, and does Resend backend change or replace the Constant Contact sender task? |
| Remaining membership contacts need email path. | `Send Long-Lapsed Email-Only Renewal to 11 recipients`; `Confirm membership email audience groups`; `Build Touch 1 draft campaigns in Constant Contact`; `Define reply monitoring plan for membership emails` | In progress + To Do | Segment-by-segment cross-check; no broad duplicate task | Which gate is blocking sends now: sender, audience approval, reply monitoring, or Haley comfort? |
| Sponsor packet tier ladder needs decision before packet ships. | `Draft sponsor packet v2` | In progress | Merge into existing | Is the tier-ladder decision the blocker inside this task, or only one subpart? |
| Grant-status website update. | No direct dashboard task found; grant research task exists. | To Do research only | Open question / possible context | Is there an actual website-update task, or is this status context from the brief? |

### DDD rows - resumed triage

```text
Brief says:
Finish the sponsor packet by adding lower tiers, stretching upward, and recalibrating the Presenting tier before any packet leaves.

Dashboard says:
Existing task `Draft sponsor packet v2` is `in_progress`, label `Decision`, initiative `Sponsorship Plan`, area `Sponsorships`, no owner, no due date, attachment present. Notes already say the board-review tier structure draft is ready, the board-facing tier structure needs approval, v1 perks need audit, and then the sponsor-facing Sponsor Packet V2 copy can be drafted. Comment from Kaelen says this is not final sponsor-facing packet yet.

Possible task:
none new

Validation question:
Is the tier-ladder decision the main blocker inside `Draft sponsor packet v2`, or only one subpart of the existing sequence?

Handling:
merge into existing
```

Reconciliation: no dashboard update proposed for sponsor tier ladder right now. Existing task already captures the blocker and sequence; creating a duplicate would add noise. Revisit only if the team wants owner/due-date assignment for the tier decision.

```text
Brief says:
68 membership letters were mailed, and the rest pivots to email. The email half is blocked on mailbox / Constant Contact verification and needs close reply/bounce tracking.

Dashboard says:
Existing task `Send Long-Lapsed Email-Only Renewal to 11 recipients` is `in_progress`, owner `Kaelen`, due `2026-05-11`, initiative `Recently Lapsed Member Letter`. Notes say this is Touch 1 for 11 long-lapsed donors who could not receive the physical letter but had emails recovered through Constant Contact. Separate campaign tasks already exist for `Build Touch 1 draft campaigns in Constant Contact`, `Confirm membership email audience groups`, `Confirm Constant Contact sender address`, and `Define reply monitoring plan for membership emails`.

Possible task:
none new

Validation question:
Is the brief's "rest converts to email" meant as the whole Warm/Cold/Brick Buyers membership campaign, while the 11-person task is only the no-physical-address long-lapsed segment?

Handling:
merge into existing
```

Reconciliation: no dashboard update proposed for the membership remainder right now. The dashboard already has the correct split: one in-progress 11-person segment plus separate To Do gates for Constant Contact drafts, audience approval, sender identity, and reply monitoring. A broad "send the rest by email" task would duplicate and blur those gates.

```text
Brief says:
Derek joined the development committee, sponsor outreach is his first lane, his mailbox was issued, internal site access exists, and he still needs either Workspace admin or an appropriate role. The action table also says to confirm Derek logged into his mailbox.

Dashboard says:
No existing dashboard task directly covers Derek onboarding, `derek@thenorthstarhouse.org`, sponsor-outreach access, Workspace/admin role, or internal-site posting access. The closest dashboard work is `Draft sponsor packet v2`, but that is packet/tier structure work, not Derek access or onboarding.

Possible task:
Confirm Derek can access `derek@thenorthstarhouse.org` and decide what role/access he needs for sponsor outreach.

Validation question:
Is this meant to be a dashboard task, or is Derek's mailbox/internal-site access already complete enough that only sponsor-packet readiness matters?

Handling:
new task candidate
```

Reconciliation: propose one pending dashboard task only if the team wants Derek access/onboarding tracked. Keep it narrow; do not fold Empire Mine or sponsor outreach strategy into this unless ownership is confirmed separately.

```text
Brief says:
Open the Empire Mine conversation around a school-program lunch partnership: kids visit Empire Mine, then come to North Star House for lunch on a Wednesday tour day. The brief frames Empire Mine as a partnership door ready to open.

Dashboard says:
No existing dashboard task directly covers Empire Mine, school visits, Wednesday lunch logistics, or partnership outreach. Existing sponsorship tasks do not cover this. Dashboard has no owner, due date, or active partnership initiative for it.

Possible task:
`Check in on whether Derek/Haley is opening the Empire Mine partnership conversation this week, including the school-lunch idea as one possible thread.`

Validation question:
Is there a confirmed owner and near-term outreach plan, or is this still partnership context/research?

Handling:
follow-up / check-in candidate
```

Reconciliation: upgraded from parked context to lightweight follow-up candidate. It should not read as "Derek owns school lunch" unless confirmed. Better phrasing: check whether Empire Mine outreach is happening this week and keep the school-lunch idea attached as context for that conversation.

```text
Brief says:
Nisenan Arts Gallery / Ubaseo collaboration may be reachable through an Arts Council introduction. The brief emphasizes that the respectful way in matters more than the exact program idea.

Dashboard says:
No existing dashboard task covers Nisenan, Ubaseo, Arts Council introduction for a cultural partnership, or tribe-led classes/programming. The only Arts Council-adjacent dashboard context currently visible is grant/fiscal-sponsorship context, not this partnership lane.

Possible task:
none yet; possible future task would be `Define the respectful first step for a Nisenan Arts Gallery / Arts Council introduction`.

Validation question:
Is there a confirmed person who should request the Arts Council intro, or should this remain a relationship/context note until the approach is clearer?

Handling:
context/research
```

Reconciliation: no dashboard update proposed for Nisenan right now. This is stronger than noise, but relationship timing matters. User added that Kaelen may need to make progress on an existing Arts Council cultural-asset mirror before opening new North Star asks through that relationship. Keep it as context unless the fiscal-sponsorship or partnership path needs a concrete outreach step.

Sandbox representation chosen: add Kaelen Current Focus item `Clarify respectful next step for Nisenan / Arts Council intro`. Do not create a Development task. Keep the shared lane in Outreach under `Creative / Discuss holding classes - Uba Seo: Nisenan Arts & Culture`.

```text
Brief says:
Post a public-facing grant status update on the website for donor/board/partner legibility ahead of the next meeting.

Dashboard says:
No existing dashboard task directly covers posting a grant-status update to the website. Existing grant task is `Grant Potential: USDA Community Facilities Direct Loan & Grant Program 11`, status `todo`, label `Research`, and only covers a grant opportunity URL. `Historic Blog Posting` exists, but it is generic and not clearly the grant-status update.

Possible task:
Create `Post grant status update on the website`.

Validation question:
Should this be a standalone website/grants task, or should it be folded into an existing website/blog workflow?

Handling:
new task candidate
```

Reconciliation: propose a pending dashboard task. Unlike Empire/Nisenan, this has clearer action pressure: transcript says the grant was submitted, the site grant update had not been done, and the goal was to have it done by the next meeting.

```text
Brief says:
The next grant requires fiscal sponsorship from Arts Council, and Gianna has confirmed willingness.

Dashboard says:
No direct dashboard task covers Arts Council fiscal sponsorship, Gianna, or the next grant's fiscal-sponsor dependency. Existing grant task is `Grant Potential: USDA Community Facilities Direct Loan & Grant Program 11`, status `todo`, label `Research`, which may be related to grant discovery but not clearly this fiscal-sponsorship dependency.

Possible task:
none new unless the next grant application is actively blocked on formal fiscal-sponsor paperwork.

Validation question:
Is fiscal sponsorship already sufficiently confirmed as context, or does someone need to secure/document the formal Arts Council fiscal-sponsor commitment for a specific grant?

Handling:
context/dependency
```

Reconciliation: no dashboard update proposed right now. Preserve as dependency context for grant work. Promote only if a specific grant application needs formal Arts Council documentation or follow-up with Gianna.

User refinement: this probably needs its own drilldown session. Treat as a rabbit-hole candidate rather than a basic-pass dashboard update.

User correction on resume: the fiscal-sponsor "yes" was from Eliza, not Gianna, and Eliza is stepping down as Arts Council lead. Treat fiscal sponsorship as uncertain, not confirmed. Kaelen wants to broach it again eventually, but the more immediate Current Focus work is getting the current grant list into the donor app somehow: either an MVP spreadsheet/table or a fuller integrated todo/list structure.

Sandbox task added with user approval: `Port current pursued grants into Development Dashboard`, label `Technical`, status `todo`, owner `Kaelen`, due `2026-05-11`, no notes. Mirror task id: `1358d1dc-9281-4c48-a45a-4b9d303d7c59`. This should be considered for live promotion at the end gate if the sandbox representation still feels right.

Clarified framing: current pursued grants reportedly live in Plane.so. The task is not simply "post a grant update" and not necessarily to build a final grants module. It is to decide and execute the first useful way to surface or port the pursued-grants list into the Development Dashboard/site. Options include linking to Plane.so, embedding/importing a simple table, or creating a more integrated grants tracker later. Do not create a separate public grant-status task until this structure decision is clearer.

Sandbox task update approved: existing grant lead task renamed from `Grant Potential: https://www.rd.usda.gov/programs-services/community-facilities/community-facilities-direct-loan-grant-program-11` to `Research USDA Community Facilities grant fit`; label remains `Research`; owner set to `Kaelen`. Mirror task id: `4f1bf813-3560-4f6e-9fad-0f1af40d0876`.

```text
Brief says:
Bat netting on the second floor plus twelve basic upstairs doors can be framed as a paired grant/sponsorship angle: pest-extermination grant logic for the bats, sponsorship angle for the doors.

Dashboard says:
No existing dashboard task covers bat netting, upstairs doors, pest-extermination grants, or a door sponsorship package. Existing `Draft sponsor packet v2` is about general sponsor packet/tier structure; existing `Grant Potential: USDA...` is grant research and does not mention bats/doors.

Possible task:
`Research unusual/local/corporate/in-kind grant sources for bat-netting safety work and the 12-door sponsorship concept.`

Validation question:
Is this a near-term funding package we want to scope now, or just a strategic angle to keep in the grant/sponsorship context pile?

Handling:
research task candidate
```

Reconciliation: upgraded from parked context to a research-task candidate. Transcript supports looking beyond standard government databases toward "weirder grants," local sources, community/corporate/tax-break style funding, plus the bat-safety and door-sponsorship angles.

```text
Brief says:
The mid-summer magician event is thin two months out because the partner is hard to reach. The brief frames it as a go/defer decision, with likely defer to next year and a flyer ready early.

Dashboard says:
No current To Do / In Progress / Done task directly covers the magician event, event deferral, vendor booking, or next-year flyer.

Possible task:
`Decide whether to defer the mid-summer magician event and, if deferred, create the next-year flyer plan.`

Validation question:
Is this decision still live, or has the team already accepted deferral as the working plan?

Handling:
open decision
```

Reconciliation: promote as a pending dashboard task only if the decision is still live. If deferral is already accepted, this becomes context for a later marketing/event planning task rather than urgent work.

```text
Brief says:
Mother's Day sold out at 40 attendees. Cake was replaced by half-price macarons after sponsor/licensing confusion. One brief card mentions a post-event survey to test with a permissions caveat.

Dashboard says:
No current dashboard task covers Mother's Day follow-up, post-event survey, cake/sponsor cleanup, or attendee feedback.

Possible task:
`Research whether and how Mother's Day attendees can be emailed for an event follow-up/survey when email addresses exist but marketing permission is unclear.`

Validation question:
Is this a permissible event-specific follow-up, or would it become marketing email without consent?

Handling:
research / decision candidate
```

Reconciliation: upgraded from possible noise to a narrow research/decision candidate. The task is not "send a Mother's Day follow-up"; it is "figure out whether/how follow-up is allowed and useful."

```text
Brief says:
Maury Horn re-emerged at Celtic Festival. He is framed as a long-time donor with an $8,000 previous gift and unresolved context around a prior offer to fund upstairs clearing that was declined. The brief asks who told him no and why.

Dashboard says:
No current dashboard task directly covers Maury Horn, donor re-engagement research, or the upstairs-clearing refusal context. Existing membership and sponsorship tasks do not name him.

Possible task:
`Research Maury Horn donor history and prior upstairs-clearing offer before any re-engagement.`

Validation question:
Is Maury an active re-engagement priority, or is this donor context that should stay parked until someone plans outreach?

Handling:
context / possible research task
```

Reconciliation: do not create a donor outreach task yet. This is signal, not noise, but tasking it without an owner or outreach plan risks turning sensitive donor history into generic follow-up. Add to pending proposals only if the team wants donor-history research tracked now.

User refinement: this also belongs in the larger outreach-system context. The point is not only Maury; it is making sure chance donor interactions become durable notes/actions in the outreach profile instead of disappearing after a conversation. Transcript confirms Maury notes were already entered into the outreach/donation profile, so this is currently more of a pattern/context item than a new task.

Outreach page check: Haley's Outreach system already has a completed logged entry for Maury Horn:

- Area: `Donors`
- Title: `Chance Meeting`
- Contact: `Maury Horn`
- Status: `completed`
- Date: `2026-05-03`
- Submitted by: `Haley`
- Notes preserve the Celtic Festival conversation, his local-artist/community-funding interest, marketing/PR background, donor-list context, and prior upstairs-clearing offer.

Reconciliation: do not create a new Development Dashboard task for Maury from the brief alone. If the team wants to act, the clean next step is an Outreach follow-up/comment or a relationship-specific research item, not a generic Development task.

```text
Brief says:
Google Ads for weddings are not performing, KVMR story/interview ideas exist, yard signs and banner spaces may increase community exposure, and the broader development plan includes community-facing awareness beyond membership emails.

Dashboard says:
No current dashboard task directly covers the whole community-exposure / advertising / media strategy lane. Some individual snippets could map to marketing/event operations, but splitting them into separate tasks from the brief would likely fragment the real issue.

Possible task:
none from basic pass; likely separate drilldown: `Drill down on community exposure strategy: Google Ads, Facebook/social posting, KVMR/radio/podcast, signs, banners, and how this supports the development plan.`

Validation question:
Should this become a dedicated drilldown before any dashboard task is created?

Handling:
rabbit-hole candidate
```

Reconciliation: no dashboard update proposed from the basic pass. Treat Google Ads / KVMR / signs / banner spaces as one broader community-exposure strategy rabbit hole, not five isolated tasks. Result of that drilldown can later determine whether a dashboard task, initiative, or notes update belongs on Haley's site.

### Outreach page cross-check

Live Outreach structure:

- Board areas: `Membership`, `Marketing`, `Sponsorships`, `Partnerships`, `Grants`, `Creative`, `Community`, `Other`
- Statuses: `Planned`, `In Progress`, `Completed`, `No Response`, `Follow Up`
- Board rows can be marked `logged_to_outreach` when moved into the outreach log.
- Outreach log entries support area, title, contact, linked donor, date, status, notes, submitted by, and comments.

Current live Outreach board rows:

- `Creative`: `Discuss holding classes - Uba Seo: Nisenan Arts & Culture` — planned, May 2026, not logged
- `Grants`: `Touch base with Arts Council regarding operations grant` — planned, May 2026, not logged
- `Marketing`: `Banner Spaces around Nevada County` — planned, May 2026, not logged
- `Membership`: `Finish out 2026 Membership Campaign` — planned, May 2026, not logged
- `Partnerships`: `Empire Mine` — planned, May 2026, not logged
- `Sponsorships`: `Mike Bratton at State Farm` — planned, May 2026, not logged
- `Sponsorships`: `B&C Ace Hardware` — planned, May 2026, not logged

Reconciliation: several brief items that looked like loose Development Dashboard candidates are already represented better on Outreach:

- Empire Mine should probably merge into the existing `Partnerships / Empire Mine` outreach board row, with school-lunch or meeting-week context added there only after we decide phrasing.
- Banner spaces / signage belongs under the existing `Marketing / Banner Spaces around Nevada County` outreach board row, not a new Development task.
- Nisenan / Arts Council classes belongs under `Creative / Discuss holding classes - Uba Seo: Nisenan Arts & Culture`.
- Arts Council operations grant belongs under `Grants / Touch base with Arts Council regarding operations grant`.
- Membership-campaign outreach context may relate to `Membership / Finish out 2026 Membership Campaign`, but send mechanics still belong with the membership email tasks.
- Sponsor lead notes for Mike Bratton / B&C Ace Hardware should stay in Outreach/Sponsorships unless they become packet, ask, or follow-up tasks.

Working rule added by this check: before promoting a brief item into a Development Dashboard task, also check whether it is already an Outreach board/log item. If yes, propose an Outreach comment/note/update instead of a new Development task.

Banner spaces reconciliation: no Development Dashboard task. Outreach already has `Marketing / Banner Spaces around Nevada County`. If Kaelen personally works it, a manual `team_focus_entries` Current Focus item is the cleaner representation than taking ownership of a formal To Do. Sandbox test confirmed this works with `Research local banner-space costs`.

### Batch: sponsorship / creative / photo-location items

```text
Brief says:
Reach five past sponsors this month: Mike Bratton, Hill Flat Lumber, BNC/B&C, Ace, possibly New Wave. Draft bespoke cover letters on top of the packet.

Dashboard says:
Existing task `Draft sponsor packet v2` is already In Progress and is the controlling blocker. Outreach already has sponsor board rows for `Mike Bratton at State Farm` and `B&C Ace Hardware`. Sponsor page data has 16 sponsor records, including past sponsors `B&C Hardware`, `Hills Flat Lumber`, `State Farm Insurance`, `It Pays to Insulate`, `Lincoln & Long Engineering`, `Melas Energy Engineering`, and `Rose Roofing`; `New Wave Green` is current.

Possible task:
none new; consolidate under `Draft sponsor packet v2` as checklist/subtasks: finish tier ladder, identify final past-sponsor list, draft bespoke cover-letter inputs, then start outreach.

Validation question:
Is the packet ready enough to activate outreach, or is sponsor outreach still blocked by the tier/packet decision?

Handling:
merge into existing
```

Reconciliation: do not create five separate past-sponsor outreach tasks. The sponsor packet task should carry the checklist. Outreach sponsor rows can carry contact-specific status once outreach begins.

User correction: Mike Bratton and State Farm are one lane; BNC and Ace Hardware are one lane. Transcript supports three known sponsor lanes for the near-term packet round: BNC/Ace, Mike Bratton/State Farm, and Hills Flat Lumber. Transcript separately mentions a next-month goal of five new sponsor prospects. Sandbox task `Draft sponsor packet v2` updated with concise sponsor-outreach context and selection logic: use sponsor tracker, sponsor page/donor history, local fit, warm intro path, and realistic ask size before cold prospecting. Future drilldown should confirm whether the next need is two more warm prospects for this packet round or a separate list of five new prospects for next month.

```text
Brief says:
Bespoke cover letters should reference each past sponsor's specific giving history. Sponsor list tracker.xlsx may be Haley's source material.

Dashboard says:
Existing `Draft sponsor packet v2` is the natural parent. Sponsor page already stores sponsor records, in-kind contributions, notes, logos, and acknowledgments. No separate dashboard task is needed unless cover-letter drafting becomes a workstream with its own owner/deadline.

Possible task:
none new; add as checklist/comment under `Draft sponsor packet v2`: `Use sponsor records / tracker to draft bespoke cover-letter blurbs for the selected past sponsors.`

Validation question:
Is cover-letter drafting part of finishing the packet, or should someone draft letters only after the final sponsor list is locked?

Handling:
merge into existing
```

Reconciliation: cover letters are not a separate task yet. They are packet/outreach preparation.

```text
Brief says:
Track Cake and similar in-kind contributors in the sponsorship dashboard.

Dashboard says:
Sponsor infrastructure exists and is populated: `Sponsors`, `Sponsor In-Kind`, and `Sponsor Acknowledgments`. Live service-role read found 16 sponsors, 19 in-kind entries, and 4 acknowledgments. Existing in-kind examples include History Mill, State Farm, B&C Hardware, Hills Flat Lumber, Rose Roofing, and others. No Cake/Cake-like sponsor entry was found in the quick read.

Possible task:
`Add Cake / Mother's Day macaron sponsor context to the existing Sponsors/In-Kind system if it is not already captured.`

Validation question:
Was the half-price macaron replacement a sponsor/in-kind contribution we should track, or just vendor/problem-solving context from the event?

Handling:
update existing system, possible small task
```

Reconciliation: do not create a new tracking system task. The site already has the system. If Cake/Jen/macaron value is sponsorship-worthy, the update is to add/complete records in Sponsors/In-Kind/Acknowledgments.

User decision: keep this visible as an open decision rather than dropping it. Sandbox task created: `Decide whether Mother's Day macaron discount should be logged as in-kind sponsorship`, label `Decision`, owner `Kaelen`, status `todo`. Mirror task id: `134c596c-8df9-4a82-aa2a-ecef3d496f9d`. Notes keep it evidence-bound: vendor name, amount paid, retail value, and whether thank-you/credit is owed.

```text
Brief says:
Creative Exchange Program is cleared to promote; yoga moved to weekly programs, Jen as artist-in-residence, pricing sheet approved late 2025, and possible targeted artist outreach such as Rory at Grass Valley museum.

Dashboard says:
Outreach has `Creative / Discuss holding classes - Uba Seo: Nisenan Arts & Culture`, but that does not fully cover the broader Creative Exchange / artist outreach lane. Transcript search confirms a Creative Exchange cluster and mentions "finally got the pricing sheet," so this is not obviously hallucinated. However, Kaelen flags possible context mismatch with the volunteer exchange/property-access idea.

Possible task:
none yet; context dig before tasking.

Validation question:
Does "pricing sheet" belong to Jen/classes/artist-in-residence programming, commercial photo/event pricing, or a stale/merged context from another program?

Handling:
context dig before action
```

Reconciliation: do a narrow source/context dig before promoting. Do not create a Creative Exchange task until the pricing/program boundary is clear.

```text
Brief says:
Family photo weekday availability should be added to the calendar; weekends are booked for weddings. Open questions also mention commercial photo shoot pricing and photography permits.

Dashboard says:
No current Development Dashboard task found for family photos, photo location rentals, licensing, or availability-calendar updates. Kaelen reframed this as larger than a calendar entry: possible location-rental revenue lane for family photos, period-piece shoots, modeling scenes, and commercial photography.

Possible task:
none in this basic pass; park as `photo/location-rental revenue lane` idea or future drilldown.

Validation question:
Is there an immediate calendar hygiene task, or should this become a separate strategy drilldown on photo/location rentals and permit/licensing rules?

Handling:
idea / rabbit-hole candidate
```

Reconciliation: do not let this consume the current brief triage. Preserve as a possible revenue-strategy drilldown.

### Rabbit holes

- IONOS / Resend sender infrastructure
  - Source comment: `Making info@ able to send emails through Dev Dashboard` — Haley: "IONOS is processing the server access.. using Resend as the backend for this. Created list section for each volunteer sector."
  - Why it matters: may affect `Confirm Constant Contact sender address`, `Define reply monitoring plan`, and whether the 11-person long-lapsed email is gated by Constant Contact, Dev Dashboard/Resend, or both.
  - Code finding: Dev Dashboard volunteer/group email sends use Supabase Edge Function `send-email`, which calls Resend with `RESEND_API_KEY`.
  - Code finding: Edge Function sends from `${sender} · North Star House <info@thenorthstarhouse.org>`, sends `to: info@thenorthstarhouse.org`, and BCCs recipients.
  - Code finding: volunteer email UI says sends from `info@thenorthstarhouse.org` and logs `recipient_count`, recipients, subject, and sender.
  - Separation: Membership Touch 1 campaign drafts are still Constant Contact; Resend appears tied to Dev Dashboard volunteer/list email tooling, not necessarily the Constant Contact membership campaign.
  - GWS finding: local `gws` CLI is installed and currently authenticated as `development@thenorthstarhouse.org`.
  - GWS finding: no built-in profile command found; `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` can isolate separate auth/config directories for accounts like `enders`, `development`, `info`, or `admin`.
  - GWS finding: initial `gws-info` auth for `info@thenorthstarhouse.org` used the wrong OAuth client (`126581...`) and hit Google's testing restriction (`access_denied`).
  - GWS fix: `gws-info`, `gws-development`, and `gws-enders` wrappers now force each profile's `client_secret.json`; `gws-current` clears profile/env overrides and preserves the default authenticated config for `development@thenorthstarhouse.org`.
  - GWS finding: `gws-info` is now authenticated as `info@thenorthstarhouse.org` with Gmail modify + identity scopes using OAuth client `101053...`.
  - Mailbox finding: `info@thenorthstarhouse.org` currently has two messages only, both Resend invites from `Resend <team@notifications.resend.com>` to `info@thenorthstarhouse.org`, dated Fri May 8, 2026, subject `You have been invited to join the thenorthstarhouse team on Resend`, snippet says invited by `media@thenorthstarhouse.org`.
  - Mailbox finding: both Resend invite emails contain `Accept invite` links for the `thenorthstarhouse` Resend team. Invite ids observed: `aefd82a5-5ec2-4b94-ac63-bc9885211cf0` and `41fcde37-a9cc-4809-879c-29684ab38294`.
  - User approved accepting invite. Accepted newest invite via Google login as `info@thenorthstarhouse.org`; Resend dashboard opened for team `thenorthstarhouse`.
  - Resend domain finding: `northstarhouse.org` exists in Resend, provider `IONOS`, region `us-east-1`, status `Failed`; domain events show `DNS invalid` May 09, 4:02 PM.
  - Resend DNS finding: DKIM TXT record for `resend._domainkey` is `Failed`; sending SPF records are `Verified` (`MX send -> feedback-smtp...amazonses.com` and TXT `send -> v=spf1 include:amazonses.com ~all`); receiving disabled.
  - Env finding: local `.env.local` only contains public Next/Supabase values. Dev Dashboard email runtime uses Supabase Edge Function secret `RESEND_API_KEY`; updating `.env.local` would not fix production sending.
  - Resend API key finding: Resend has existing sending-access key `Onboarding`, but only the prefix is visible after creation. Temporary duplicate keys created during investigation were deleted; current Resend API key state is only `Onboarding`.
  - Supabase secret finding: Supabase Edge Function secrets already include `RESEND_API_KEY`, last updated May 08 2026 18:25 UTC. Do not replace/rotate unless verification proves it fails.
  - Verification finding: direct unauthenticated call to deployed `send-email` returns `401 UNAUTHORIZED_NO_AUTH_HEADER`; current frontend code calls the function without `apikey` / `Authorization` headers, so the app send path is likely blocked before Resend.
  - Verification finding: same controlled test with the anon key reaches the function and Resend, but Resend returns `403` because `thenorthstarhouse.org` is not verified. This confirms the existing Supabase `RESEND_API_KEY` secret is present enough to reach Resend; remaining send blocker is domain verification, not missing `.env.local`.
  - Code fix staged locally: added shared `sendEmail()` helper that includes Supabase anon `apikey` / `Authorization` headers plus existing `x-app-token`, and routed both Dev Dashboard volunteer send call sites through it. `npm run build` passes. Full repo lint still has pre-existing unrelated errors; targeted lint for touched files has no errors.
  - DNS verification: live DNS has `resend._domainkey.northstarhouse.org` TXT, but value is the wrong public key (`...KBgQDMB0xbp...`). Resend target value starts `p=MIGfMA0GCSqG...KBgQC5pSM3...` and ends `...TrSYDV6POwIDAQAB`. IONOS login is required to replace the existing TXT value; do not add a duplicate.
  - Final blocker: IONOS login uses `admin@thenorthstarhouse.org`. Login accepted password but requires a six-digit email confirmation code sent to `admin@thenorthstarhouse.org`. That mailbox cannot currently be accessed because its password was changed about three days ago, and Google 2FA goes to a phone the user does not control. DNS fix is blocked on recovering admin mailbox / 2FA access or getting help from whoever controls that phone/account.
  - Tooling fix: added `supabase` wrappers at `C:\Users\ender\bin\supabase.ps1` and `C:\Users\ender\bin\supabase.cmd`; `supabase` now resolves on PATH through `npx supabase`.
  - Mailbox finding: no IONOS or Constant Contact messages found in the `info@` mailbox from the current two-message inbox.
  - Pointer to restore after investigation: membership-email blocker reconciliation.

## Pending dashboard update proposals

| Task | Proposed change | Reason | Status |
|---|---|---|---|
| Making info@ able to send emails through Dev Dashboard | Add note: `gws-info authenticated; info@ mailbox is reachable. Resend invite accepted as info@. Resend has only the original Onboarding sending-access key. Supabase already has RESEND_API_KEY secret from May 8; do not rotate unless it fails. Verification: unauthenticated deployed function call returned 401 because frontend send code omitted apikey/Authorization headers; local code fix now adds Supabase anon auth headers and x-app-token to Dev Dashboard send calls. With anon auth, function reaches Resend but Resend returns 403 because thenorthstarhouse.org is not verified. Resend domain northstarhouse.org failed DKIM TXT resend._domainkey; SPF/MX send records are verified. DNS fix requires IONOS login through admin@thenorthstarhouse.org, but admin mailbox recovery is blocked by Google 2FA to a phone we do not control. Remaining blocker: recover admin mailbox/2FA or get DNS access owner to replace the existing resend._domainkey TXT value, restart Resend verification, then retest send.` | Captures verified blockers and current hard stop. | applied 2026-05-10 |
| Making info@ able to send emails through Dev Dashboard | Keep status `In Progress`; keep owner `Haley` unless we assign a separate access-recovery owner. Keep/add label `Technical`. | Work is not done; exact blocker is external access, not unclear implementation. | applied 2026-05-10 |
| Define reply monitoring plan for membership emails | Add note: `info@ mailbox access is now confirmed through gws-info, but admin@ recovery/IONOS DNS access is separate and blocked by 2FA. Reply monitoring can still proceed if info@ is the chosen reply inbox.` | Separates reply monitoring from sender-domain/DNS infrastructure. | applied 2026-05-10 |
| Confirm Constant Contact sender address | Add note: `Do not treat Dev Dashboard/Resend DKIM blocker as automatically blocking Constant Contact sender decision. Confirm Constant Contact sender/display/reply settings separately.` | Prevents Resend rabbit hole from muddying Constant Contact campaign send gates. | applied 2026-05-10 |
| New task candidate: Derek access / sponsor outreach readiness | Create task candidate: `Confirm Derek can access derek@thenorthstarhouse.org and has the right sponsor-outreach role/access`. Suggested label `Technical` or `Decision`; owner TBD; no due date unless this blocks immediate sponsor outreach. | Brief and transcript support Derek mailbox/access setup, but dashboard has no matching task. Keep scope to access/role readiness, not outreach strategy. | pending |
| New task candidate: grant status website update | Create task candidate: `Post grant status update on the website`. Suggested label `Blog Post` or `Other`; area/initiative TBD; owner TBD; due before next development meeting if the team wants the transcript deadline honored. | Brief and transcript both support an explicit website update that is not covered by the current USDA grant-research task. | pending |
| Mid-summer magician event go/defer | No dashboard task. Drop from active triage queue. | User has no current context and asked to destroy this item rather than preserve it as work. | dropped |
| New task: Mother's Day/event follow-up opt-in process | Sandbox task created: `Design event follow-up opt-in process`, label `Research`, owner `Kaelen`, status `todo`. | Perplexity research supported a narrow task: do not add attendees to ongoing marketing without consent; one event-specific thank-you/survey may be acceptable if handled carefully; future event forms need explicit optional opt-in. Mirror task id: `364ae8d8-80a4-455f-9ac5-653c268b5d05`. | approved in sandbox |
| Empire Mine partnership check-in | No dashboard task for now. Keep as sidecar context because Outreach already has `Partnerships / Empire Mine`. | User agreed nothing should be added for Empire yet. School-lunch idea remains context inside the existing Outreach lane. | dropped |
| Bat netting / upstairs doors funding | Sandbox task created: `Research funding options for bat netting and upstairs doors`, label `Research`, owner `Kaelen`, status `todo`, initiative `Grants`. | User approved adding this to the board under Grants. Mirror task id: `55b3f2e7-5426-4299-b0cc-d304b02c715d`; Grants initiative id: `620f716d-da00-42c2-aaf2-6a829a1e998a`. | approved in sandbox |
| Optional research candidate: Maury Horn donor context | Create only if donor re-engagement is active: `Research Maury Horn donor history and prior upstairs-clearing offer before any re-engagement`. Suggested label `Research` or `Decision`; owner TBD. | Brief/transcript indicate sensitive donor context, but no dashboard task or owner confirms outreach should happen now. | parked unless activated |

No visible task comments were left. A short-lived set of `DDD` comments was added for UI visibility, then removed at user direction. Rollback/removal snapshots: `sidecars/task-comments-rollback-2026-05-10T09-42-29-661Z.json` and `sidecars/removed-ddd-comments-*.json`.

## Gate candidates

- Merge: confirmed tasks with clear owner/action/blocker.
- Promote: unresolved open questions that block real work.
- Drop: unsupported or decorative synthesis.
- Merge candidate: sponsor tier ladder decision.
- Merge candidate: campaign sender / Constant Contact verification.
- Merge candidate: remaining membership email after sender verification.
- Promote candidate: Derek account/role clarification.
- Promote candidate: June magician event go/no-go.
- Promote candidate: grant-status website update.
- Promote candidate: Mother's Day follow-up permission research.
- Promote candidate: Empire Mine partnership check-in.
- Promote candidate: unusual grants / bat netting / doors research.
- Park as tagged context/research: Nisenan and Maury Horn unless owner/action appears.

## Closeout - brief triage pass

Status: closed for this pass. Active triage queue cleared; remaining complexity is parked as separate drilldowns.

Sandbox changes approved during this pass:
- Kaelen Current Focus: `Research local banner-space costs`
- Kaelen Current Focus: `Clarify respectful next step for Nisenan / Arts Council intro`
- Development To Do: `Port current pursued grants into Development Dashboard`
- Development To Do: `Research USDA Community Facilities grant fit`
- Development To Do: `Research funding options for bat netting and upstairs doors`
- Development To Do: `Design event follow-up opt-in process`
- Development To Do: `Decide whether Mother's Day macaron discount should be logged as in-kind sponsorship`
- Development In Progress update: `Draft sponsor packet v2` now includes corrected sponsor lanes and prospect-selection logic.

No-add / parked decisions:
- Empire Mine: keep in Outreach / Partnerships context; no Development task yet.
- Mid-summer magician event: dropped from this triage pass.
- Creative Exchange / photo-location revenue: park as future drilldown, not a task from this pass.
- Sponsor prospects: future drilldown to use tracker/history/warm paths before picking targets.
- Portal / Supabase source map: future drilldown to create architecture reference for signal triage.

Progress board:
`sidecars/post-meeting-brief-triage-progress.html`
