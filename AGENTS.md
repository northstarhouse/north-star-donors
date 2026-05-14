<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## North Star GWS profiles

For Google Workspace CLI mailbox work, use wrappers in `C:\Users\ender\bin`:

- `gws-info` / `gws-info.ps1` for `info@thenorthstarhouse.org`
- `gws-development` / `gws-development.ps1` for `development@thenorthstarhouse.org`
- `gws-health` / `gws-health.ps1` to check profile auth

Do not run raw `gws auth login` for `info@thenorthstarhouse.org`; it may pick the old blocked OAuth client. The working client starts with `101053...`; the blocked old client starts with `126581...`.

## Global credentials env

Before using browser localStorage, Chrome DevTools, or manual login flows for project credentials, check the global env file:

`C:\Users\ender\.claude\.env`

This file is the canonical local credentials source for North Star work. Relevant keys include Supabase, Resend, Constant Contact, Google Workspace, and account login values. Load values from this file in scripts instead of asking the user or scraping tokens from the browser when a matching key exists.

Do not print secret values into chat or logs. It is fine to list key names.

## Linear plugin and local GraphQL fallback

Use the official Codex Linear plugin first for Linear reads and writes.

Use local direct GraphQL only as a fallback when the plugin lacks the needed operation or a concrete plugin operation fails. This fallback is not a general Linear CLI or MCP replacement.

Do not use browser DevTools for Linear unless the user explicitly asks for browser inspection or UI automation.

For Linear API access, load credentials from `C:\Users\ender\.claude\.env`. Accepted local key names may include `LINEAR_API_KEY`, `LINEAR_TOKEN`, or `LIN_API_KEY` if a helper supports them. Do not print, log, paste, or commit secret values.

Before any Linear mutation:

- verify the target with a read-only operation
- show the exact target, operation, and payload to the user
- wait for explicit approval
- run the write only through a helper with an explicit write guard
- record decisions, commands, and results in a sidecar

Never mutate Linear during documentation, discovery, schema inspection, or payload preview work.

Prefer small, operation-specific GraphQL helper commands over installing or pretending npm Linear CLIs are complete. If a new Linear operation is blocked by the plugin, add one small command to an existing helper or create one new focused helper. Keep reads and writes separate, inspect schema when the mutation shape is uncertain, preview the mutation payload before write, and gate writes behind an explicit environment variable such as `LINEAR_ALLOW_WRITE=YES`.

Historical reference: `C:\Users\ender\Documents\Playground\sidecars\linear-membership.ps1` wraps a narrow Membership Renewal Campaign helper with `verify`, `schema`, `payload`, and `post-update`. It is project-specific reference material, not the active repo CLI.

## Local drilldown bootstrap

This repo uses `basePath: '/north-star-donors'` in `next.config.ts`.

Never announce `http://localhost:4000/` as the usable app URL for this repo. A 404 at `/` is expected and does not mean the dev server is broken.

Use and announce:

`http://localhost:4000/north-star-donors/`

Before saying a local drilldown session is ready, verify all of these:

- Next dev process exists for this repo
- port `4000` is listening
- `http://localhost:4000/north-star-donors/` returns HTTP 200
- the response/page contains expected app text, such as `Development Dashboard`
- the target route under `/north-star-donors/` returns non-404

If `http://localhost:4000/` returns 404, explicitly say that is expected because of `basePath`.

If manual/browser validation needs an app-password session token in `localStorage`, say that before claiming full manual validation. Do not treat an HTTP 200 loading shell as proof that protected client data rendered.
