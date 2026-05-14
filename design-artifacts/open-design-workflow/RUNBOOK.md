# Open Design Runbook

## Current Local Install

- Repo: `C:\Users\ender\.claude\projects\OpenDesign`
- Project data: `C:\Users\ender\.claude\projects\OpenDesign\.od\app.sqlite`
- Current tools-dev stack:
  - daemon: `http://127.0.0.1:10256`
  - web: `http://127.0.0.1:6360`
  - desktop: Electron window titled `Open Design`
- Codex Open Design MCP in this session expected: `http://127.0.0.1:4454`

## Start / Verify

From `C:\Users\ender\.claude\projects\OpenDesign`:

```powershell
pnpm tools-dev status
pnpm tools-dev
```

If MCP tools report `cannot reach the Open Design daemon at http://127.0.0.1:4454`, bridge the expected port:

```powershell
pnpm exec od --port 4454 --no-open
```

Then verify from Codex:

```text
Open Design MCP: list_projects
```

Expected result: existing Open Design projects are listed.

## Import A Local Artifact Folder

Create or choose a folder with an `index.html`, then call Open Design's import endpoint:

```powershell
$body = @{
  baseDir = 'C:\absolute\path\to\artifact-folder'
  name = 'Project Name'
  skillId = 'web-prototype'
  designSystemId = $null
} | ConvertTo-Json -Depth 4

Invoke-RestMethod `
  -Method Post `
  -Uri 'http://127.0.0.1:4454/api/import/folder' `
  -ContentType 'application/json' `
  -Body $body
```

This creates an Open Design project that writes directly into the imported folder.

## Run An Agent Through Open Design

Open Design exposes `POST /api/chat`. Required fields used here:

```json
{
  "agentId": "codex",
  "model": "default",
  "reasoning": "medium",
  "projectId": "<project id>",
  "conversationId": "<conversation id>",
  "skillId": "web-prototype",
  "designSystemId": null,
  "message": "<design prompt>"
}
```

The run streams server-side and may take several minutes. Check status:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:4454/api/runs' | ConvertTo-Json -Depth 6
```

If a run writes files but remains stuck `running`, cancel it:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4454/api/runs/<run-id>/cancel'
```

## Known Failure Modes

- `tools-dev` may choose dynamic ports, such as daemon `10256` and web `6360`.
- The Codex MCP may still expect `4454`; start `od --port 4454 --no-open` to make MCP reads work.
- Open Design write tooling (`od tools live-artifacts`) needs `OD_TOOL_TOKEN`; normal shell sessions do not have it.
- Long-running Open Design agent runs may update files before the run exits. Check file mtime/size before assuming failure.
- Browser DevTools can get stuck on a closed selected tab; use direct file links or Open Design MCP reads when that happens.

## Current Linear Issue Brief Project

- Open Design project: `North Star Linear Issue Brief`
- Project id: `72bdd8e0-d12a-4b28-b672-b10a3f022999`
- Folder: `C:\Users\ender\.claude\projects\north-star-donors-gh\design-artifacts\linear-issue-brief-od`
- Entry file: `index.html`
