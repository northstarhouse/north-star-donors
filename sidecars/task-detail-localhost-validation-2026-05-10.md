# Drilldown sidecar - Task detail localhost validation
Date: 2026-05-10
Parent task: Validate minimal task detail MVP before any live workflow decision
Session ceiling: Test the local task detail route behavior on localhost and end with a narrow recommendation.

## Open todos

* Test existing task detail route from dashboard
* Test existing task detail route from team page
* Test direct refresh on existing `/tasks/[taskId]/`
* Test notes save/reload
* Test comments post/reload
* Test attachment link if available
* Test or simulate new-task-after-build static-route failure mode

## Notes / observations

- Do not deploy, push, merge, or widen the feature during this session.
- Current prototype uses `/tasks/[taskId]/` with static params under `output: 'export'`.
- Localhost reliability finding: port `4000` is bound by the Next dev server for this repo.
- Localhost reliability finding: `http://localhost:4000/` returns 404 by design because `next.config.ts` sets `basePath: '/north-star-donors'`.
- Localhost reliability finding: `http://localhost:4000/north-star-donors/` returns 200 and contains `Development Dashboard`.
- Localhost reliability finding: `http://localhost:4000/north-star-donors/tasks/63ec1fc9-3798-40b1-a9bd-18fdc3dbe0ef/` returns 200 at the HTTP route level, but server HTML only shows the client loading shell; full data verification needs an app-password session token in browser localStorage.
- Reusable bootstrap rule: do not announce `localhost:4000` as usable for this repo. Announce and verify the base-path URL: `http://localhost:4000/north-star-donors/`.
- Protocol locked into `AGENTS.md`: future local drilldowns must verify process, port, base-path 200, expected page text, and target-route non-404 before saying ready. Root `/` 404 must be reported as expected because of `basePath`.
- Operational skill created: `C:\Users\ender\.codex\skills\northstar-local-drilldown\SKILL.md`.
- Bootstrap script created: `C:\Users\ender\.codex\skills\northstar-local-drilldown\scripts\start_or_verify.ps1`.
- Current verification from bootstrap script: ready `true`; started `false`; app URL `http://localhost:4000/north-star-donors/`; root `/` status `404` expected; port `4000` listening; app status `200`; dashboard text found; target task route status `200`.
- Mirror switch: `.env.local` was backed up to `.env.local.before-mirror-drilldown` and switched to `SUPABASE_NSH_MASTER_PORTAL_MIRROR_URL` / mirror anon key. Mirror host starts with `p`.
- Bootstrap bug found and fixed: target-route readiness must require HTTP `200`, not merely non-404.
- Mirror validation failure: `http://localhost:4000/north-star-donors/` returns 200 and dashboard text appears, but `/tasks/[taskId]/` routes return 500 in `next dev` under `output: 'export'`.
- Concrete route failure: both the old main task id and mirror-native `Draft sponsor packet v2` id (`294889a5-9c19-4dbd-83e9-b322330937d4`) return 500 with Next error: page is missing that param in `generateStaticParams()`.
- Build failure after mirror switch: `npm run build` now fails with `Page "/tasks/[taskId]" is missing "generateStaticParams()" so it cannot be used with "output: export" config`, despite the page exporting `generateStaticParams`. Treat dynamic task route approach as unsafe until resolved or replaced.
- Decision: abandon `/tasks/[taskId]/` for this repo and switch to static-safe `/task?taskId=<uuid>`.
- Route correction implemented locally: removed dynamic `app/tasks/[taskId]` route; added static `app/task/page.tsx`; moved detail UI to `app/task/TaskDetailClient.tsx`; updated dashboard and team links to `/task?taskId=<uuid>`.
- Build after route correction: `npm run build` passes; `/task` is emitted as a static route.
- Bootstrap script updated to handle query-string target paths and trailing-slash redirects. Current verification: ready `true`; app URL `http://localhost:4000/north-star-donors/`; target final URL `http://localhost:4000/north-star-donors/task/?taskId=294889a5-9c19-4dbd-83e9-b322330937d4`; target status `200`.
- Playwright validation on mirror:
  - Dashboard visible task-detail link opens `/north-star-donors/task/?taskId=876f7525-b817-4d41-965e-c5a721def133` and renders `Audit sponsor packet v1 perks for deliverability`.
  - Direct refresh of the same static-safe task URL reloads and renders the task.
  - Team page task-detail link opens `/north-star-donors/task/?taskId=82925293-a4eb-49d2-8f6e-ebe854a3e3a7` and renders `Send Long-Lapsed Email-Only Renewal to 11 recipients`.
  - Notes save/reload on mirror persisted during test, then cleanup restored original notes.
  - Comment post/reload visibly persisted; automated assertion failed only because the marker also appeared in the notes textarea. Cleanup removed the test comment. Follow-up DB check confirmed no `DDD mirror validation` marker remains in notes or comments.

## Gate candidates

- Keep `/tasks/[taskId]/`
- Switch to static-safe `/task?taskId=...`
- Defer task detail pages
