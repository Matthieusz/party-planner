---
name: foldkit
description: Work with Foldkit using the shared source checkout for canonical conventions, APIs, and examples.
---

Read `~/.local/share/effect-solutions/foldkit/skills/foldkit/SKILL.md`
and follow it. Resolve its relative references from that shared skill directory.

This project keeps Foldkit outside Git at
`~/.local/share/effect-solutions/foldkit`, alongside the shared Effect checkout.
Interpret upstream references to `repos/foldkit/` as this shared path. Do not
vendor the source into this project. See `AGENTS.md` for setup and version pinning.
Check the shared checkout for local changes before changing its revision.
