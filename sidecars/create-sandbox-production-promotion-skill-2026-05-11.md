# Drilldown sidecar - sandbox production promotion skill
Date: 2026-05-11
Parent task: Create a repeatable skill from the failed sandbox-to-production merge
Session ceiling: A usable Codex skill exists that prevents repeating the localhost/prod mismatch failure.

## Open todos

* Capture failure pattern
  - Failure: treated Git/code parity as production parity.
  - Failure: compared Supabase summaries before comparing rendered UI.
  - Failure: diffed `team_focus_entries` first and missed visible `tasks` / `initiatives` deltas.
  - Failure: claimed done before hard reloading production in Chrome DevTools.
  - Correct signal: localhost showed `To Do 10`; production showed `To Do 6`.
* Create skill folder
  - Path: `C:\Users\ender\.codex\skills\sandbox-production-promotion`
* Write skill workflow
  - Must compare rendered sandbox and production first.
  - Must map visible differences to code/data before writes.
  - Must verify production after hard reload.
* Validate skill

## Notes / observations

- The skill is North Star specific because it relies on Haley production, mirror/live Supabase refs, `basePath`, and the local sandbox convention.
- The skill should trigger on sandbox, staging, localhost, Haley production, merge sandbox, promote staging, or push localhost changes.

## Gate candidates

- Merge: skill into local Codex skills.
- Drop: treating this as only a one-off sidecar note.
