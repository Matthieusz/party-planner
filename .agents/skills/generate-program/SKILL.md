---
name: generate-program
description: Generate a complete, idiomatic Foldkit program from a natural language description. Use when the user wants to create a new Foldkit program, scaffold a project, or says things like "build me a..." or "I want a program that..."
---

Read `~/.local/share/effect-solutions/foldkit/skills/generate-program/SKILL.md`
and follow it. Resolve its relative references from that shared skill directory.

This project keeps Foldkit outside Git at
`~/.local/share/effect-solutions/foldkit`, alongside the shared Effect checkout.
Interpret upstream references to `repos/foldkit/` as this shared path. Do not
vendor the source into this project. See `AGENTS.md` for setup and version pinning.
Check the shared checkout for local changes before changing its revision.
