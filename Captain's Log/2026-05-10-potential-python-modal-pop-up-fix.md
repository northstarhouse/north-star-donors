---
type: "captains-log"
date: "2026-05-10"
slug: "potential-python-modal-pop-up-fix"
status: "complete"
created: "2026-05-10"
---

# Potential Python Modal Pop-Up Fix

> Diagnosed and repaired a recurring Windows Python launch failure that likely caused Claude/Codex-triggered "choose an app" modal pop-ups. Root cause was a broken `.py` association plus an extensionless `C:\Windows\System32\Python` file shadowing the real interpreter.

## Status & Purpose

What got done:

- Confirmed `.py` was mapped through `Python.File`, but the open command pointed at missing `C:\Users\ender\AppData\Local\Programs\Python\Launcher\py.exe`.
- Confirmed `py` was not recognized on PATH.
- Confirmed real Python existed at `C:\Users\ender\AppData\Local\Programs\Python\Python312\python.exe`.
- Confirmed PowerShell resolved `python` first to `C:\Windows\System32\Python`, a 27-byte text file containing `-- 3 found. Proceeding...`.
- Repaired per-user `.py` and `.pyw` associations to point directly at Python 3.12 executables.
- Renamed the shadow file to `C:\Windows\System32\Python.bak-codex` through an elevated cleanup script.
- Verified fresh `cmd.exe` and PowerShell both resolve `python` to Python 3.12.10.
- Verified a harmless script runs through `C:\Users\ender\AppData\Local\Programs\Python\Python312\python.exe`.

Why it was done:

- User reported frequent modal pop-ups where Windows asks which app should open a file when Claude/Codex tries to run Python-related commands.
- The modal often did not produce a visible Codex/Claude error, making it hard for the user to attribute or reproduce.

What it was supposed to accomplish:

- Stop Windows from treating Python/script execution as an app-selection problem.
- Make future Codex/Claude Python execution route through a real interpreter.
- Leave durable notes and recovery artifacts in case the symptom returns.

Goals connected:

- Reduce local-machine friction during agent runs.
- Improve reliability of Codex/Claude tool execution on Windows.
- Preserve a concrete forensic trail instead of relying on memory.

## Scope & Next Moves

Still left to do:

- Nothing active for this issue unless the modal returns.
- If it returns, capture the immediately preceding command/tool action and re-check Python resolution.

Immediate next steps:

- Treat the issue as good for now.
- Future Python runs should prefer explicit `python script.py` instead of naked `.py` execution when practical.

Deadlines:

- None.

Ownership:

- Codex owns future diagnostic follow-up if the modal appears during a Codex-run command.
- User only needs to report that it happened again if the popup returns.

## Resource & Capacity

Cost:

- Local diagnostic time, Perplexity research time, one elevated Windows rename action.

Who else got pulled in:

- Perplexity was used for external corroboration.
- No human third party was needed.

What did not get done because this happened:

- None recorded. The work was a contained troubleshooting session.

## Risk & Dependency

What could go wrong:

- Another installer or Windows app alias could later rewrite Python associations.
- A separate tool could invoke `.py` files in a way that still depends on ShellExecute behavior rather than `python.exe`.
- Removing/renaming the `System32` shadow fixed the observed PowerShell resolution, but the original source of that stray file is unknown.

Waiting on someone else:

- Nothing.

Unverified assumptions:

- The recurring modal was caused by these Python resolution failures. This is strongly supported by the local evidence and external research, but the modal was not reproduced live during the final verification.

## Decisions, Stakeholders, Learning

Who needs to know:

- User.
- Future Codex/Claude sessions working on this machine.

Decisions:

- Do not reinstall Python as the first fix; direct repair was cleaner and verified.
- Keep registry backups and cleanup scripts under `.scratch/python-windows-fix/`.
- Keep the drilldown sidecar as the detailed trace.

Explicitly not done:

- Did not merge origin/main into the dirty local workspace while retrieving the Captain's Log skill.
- Did not create dashboard tasks.
- Did not delete the suspicious `System32` file outright; renamed it to a recoverable backup.

What surprised us:

- `cmd.exe` initially managed to find real Python, while PowerShell selected the bogus extensionless `C:\Windows\System32\Python` first.
- `assoc` / `ftype` did not reflect the repaired HKCU per-user association, so direct registry checks were the better verifier.

What should change next time:

- When Codex sees a Python modal or silent Python failure on Windows, check `Get-Command python -All`, `python --version`, HKCU `.py` association, and any `System32` shadow before blaming the caller.
- Prefer explicit interpreter invocation for temporary scripts.

## Evidence & Artifacts

- Drilldown sidecar: `sidecars/python-modal-loop-2026-05-10.md`
- Repair script: `.scratch/python-windows-fix/fix-python-windows-association.ps1`
- Admin cleanup script: `.scratch/python-windows-fix/rename-system32-python-shadow.ps1`
- Registry backups: `.scratch/python-windows-fix/registry-backup/`
- Cleanup log: `.scratch/python-windows-fix/rename-system32-python-shadow.log`

## Threads we noticed

- User wants Codex to make an audible sound when it is done and waiting for feedback.
- Captain's Log skill was pushed to `endersclarity/vault-mirror` at commit `4e5b7ff`; local workspace was fetched but not merged because it had local changes.
