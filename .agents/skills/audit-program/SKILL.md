---
name: audit-program
description: Audit an existing Foldkit program against the architecture, conventions, and quality bar. Use when the user wants to review their Foldkit code, check for anti-patterns, accessibility gaps, or quality regressions. Triggers on phrases like "audit my app", "review this Foldkit code", "check for anti-patterns", "is this idiomatic?", or "what would the reviewer find?"
---

Read `~/.local/share/effect-solutions/foldkit/skills/audit-program/SKILL.md`
and follow it. Resolve its relative references from that shared skill directory.

This project keeps Foldkit outside Git at
`~/.local/share/effect-solutions/foldkit`, alongside the shared Effect checkout.
Interpret upstream references to `repos/foldkit/` as this shared path. Do not
vendor the source into this project. See `AGENTS.md` for setup and version pinning.
Check the shared checkout for local changes before changing its revision.
