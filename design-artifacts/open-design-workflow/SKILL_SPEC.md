# Proposed Skill: open-design-workflow

## Purpose

Use Open Design for actual visual design work instead of falling back to plain HTML, and preserve the setup steps so the user does not need to re-explain Open Design each time.

## Trigger

Use when the user says:

- "use Open Design"
- "ask Open Design"
- "run this through Open Design"
- "make this actually designed"
- "design artifact"
- "not just HTML"

## Workflow

1. Check `pnpm tools-dev status` in `C:\Users\ender\.claude\projects\OpenDesign`.
2. If Open Design is not running, start it with `pnpm tools-dev`.
3. If Codex Open Design MCP cannot reach `http://127.0.0.1:4454`, start the compatibility daemon:
   `pnpm exec od --port 4454 --no-open`.
4. Verify MCP with `list_projects`.
5. Create or import a project through `POST /api/import/folder`.
6. Run an agent through Open Design's `/api/chat` endpoint, not a local fallback, unless Open Design is genuinely blocked.
7. Poll `/api/runs` and file mtimes.
8. If a run updates files but remains stuck, cancel the run and keep the artifact.
9. Show the artifact path, Open Design project id, and a short explanation of the design direction.

## Guardrails

- Do not silently fall back to standalone HTML when the user explicitly asks for Open Design.
- Say when Open Design is unavailable and include the exact command/error.
- Prefer Open Design's project/import/chat APIs over direct SQLite writes.
- Do not print tokens or secret environment values.
- Keep generated artifacts in a dedicated folder with an `index.html`.

## Output Shape

Return:

- Open Design project name/id
- artifact path
- web/file URL if available
- design direction summary
- any setup problem or run cancellation that happened
