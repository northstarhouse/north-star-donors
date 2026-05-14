---
name: northstar-local-drilldown
description: Start or verify the north-star-donors local dev server for drilldown work. Use when the user says "start local drilldown for north-star-donors", "verify north-star localhost", "open Haley's site locally", or asks to run/test localhost for this repo.
---

# North Star Local Drilldown

Use this for local validation sessions in `<repo-root>`.

## Rule

This repo has `basePath: '/north-star-donors'`. Never report `http://localhost:4000/` as the app URL.

Use:

```text
http://localhost:4000/north-star-donors/
```

If `/` returns 404, say that is expected because of `basePath`.

## Workflow

1. Run `scripts/start_or_verify.ps1`.
2. Report the script result exactly enough to include:
   - whether the server is running
   - whether port `4000` is listening
   - whether `/north-star-donors/` returned 200
   - whether expected dashboard text appeared
   - whether target route, if provided, returned non-404
   - exact URL the user should open
3. Do not continue feature work until local readiness is verified.
4. If browser validation needs app-password/localStorage auth, say so before claiming full manual validation.

## Optional Target Route

Pass a target route under the base path when testing a specific page:

```powershell
powershell -ExecutionPolicy Bypass -File "<repo-root>\skills\northstar-local-drilldown\scripts\start_or_verify.ps1" -TargetPath "/tasks/<task-id>/"
```

Without `-TargetPath`, the script verifies the dashboard root.
