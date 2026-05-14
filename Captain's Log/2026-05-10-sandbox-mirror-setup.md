---
type: "captains-log"
date: "2026-05-10"
slug: "sandbox-mirror-setup"
status: "complete"
created: "2026-05-10"
---

# Captain's Log: Sandbox Mirror Setup

> Created a safer local sandbox for North Star donor-site work: live-equivalent frontend code, mirror Supabase backend, and verified isolation from Haley's live rows.

## Status & Purpose

We needed a way to test Haley's development dashboard and related donor-site changes without writing to the live Supabase project. The immediate issue was that `localhost:4000` work had become risky and confusing because local code could point at different backends.

The chosen setup was an isolated sandbox clone under:

`C:\Users\ender\.claude\projects\north-star-donors-gh\sandbox\north-star-donors`

The sandbox clone tracks the live GitHub repo and is locally excluded from the parent repo's git status.

## What Got Done

- Fixed the local Supabase PowerShell wrapper at `C:\Users\ender\bin\supabase.ps1`; it was not forwarding subcommands correctly.
- Verified Supabase CLI syntax against current Supabase CLI docs via Context7.
- Confirmed relevant Supabase tokens live in `C:\Users\ender\.claude\.env`; no secrets were printed into chat.
- Created or reused a sandbox clone of `northstarhouse/north-star-donors`.
- Pointed sandbox `.env.local` at the mirror Supabase project:
  - mirror ref: `pasamzrwwaqhiwkixpbt`
  - live ref: `uvzwhhwzelaelfhfkvdb`
- Refreshed mirror app-table data from live through service-role REST reads and mirror writes.
- Found that the mirror was not architecture-identical: several tables and columns were missing or stale.
- Patched the mirror schema enough to support current live app tables and complete the data refresh.
- Installed sandbox dependencies and ran `npm run build` successfully.
- Started sandbox dev server on:

`http://localhost:4001/north-star-donors/`

## Verification

Verified sandbox `.env.local` points at:

`https://pasamzrwwaqhiwkixpbt.supabase.co`

Verified that URL matches the mirror project and does not match the live project.

Verified the sandbox dev server reports `.env.local` as active and serves the basePath route:

`http://localhost:4001/north-star-donors/`

`http://localhost:4001/` returns 404, which is expected because the repo uses `basePath: '/north-star-donors'`.

## Decisions

- Do not build a CLI-Anything harness right now.
- Keep CLI-Anything as a later idea for wrapping repo/backend operations once the workflow is stable.
- Use the sandbox as the current safe place to test UI/data behavior.
- Do not update task notes in Haley's live system unless explicitly asked.

## Risks & Caveats

- Storage buckets/files were not fully verified or cloned. Database writes are isolated to mirror, but existing file URLs may still point to stale or live-hosted public assets.
- The mirror schema had drifted from live. Some patches were applied directly to the mirror to make the sandbox usable, but this should be treated as operational setup, not production migration work.
- The sandbox is a close working copy for app tables and current code, not a guaranteed full Supabase project clone including storage, auth settings, policies, edge functions, or external integrations.

## Next Moves

- Use `http://localhost:4001/north-star-donors/` for safe sandbox testing.
- If file upload/image/attachment behavior matters, verify or clone storage buckets separately.
- If the sandbox becomes a repeated workflow, turn the refresh/start/verify flow into a durable command or small harness.
- Keep live deployment work separate from mirror experimentation.

## Threads We Noticed

- CLI-Anything could later become useful for fast natural-language operations once the app architecture is stable.
- Mirror drift itself is a signal: if this sandbox matters, refresh and schema-sync need a repeatable protocol.
- Localhost safety depends on always checking backend target, not just whether the server is running.
