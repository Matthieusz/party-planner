# Project tooling

Use Bun (the version is recorded in `package.json`).

Use CodeGraph to explore symbols and their relationships when navigating the
codebase: `codegraph query`, `codegraph context`, `codegraph callers`, and
`codegraph impact` are useful starting points. Run `codegraph status` and
`codegraph sync` when the index needs updating; verify findings against source.

- `bun run lint`: Oxlint with Foldkit's recommended preset and vendored anti-slop rules.
- `bun run lint:fix`: apply available lint fixes; review the changes.
- `bun run format`: format owned files with Oxfmt.
- `bun run format:check`: check formatting without modifying files.
- `bun run typecheck`: tsrs with Effect diagnostics via `@effect/tsgo`.
- `bun run check`: lint, formatting, and typechecking.
- `bun test test/unit`: local unit tests.

Lint policy lives in `oxlint.config.ts`; formatting policy lives in
`oxfmt.config.ts`. Anti-slop is owned, vendored code under
`tools/oxlint/anti-slop/`, excluded from application linting and formatting.
Consult its `UPSTREAM.md` before updating it. Its Effect rule currently checks
relative project imports, not package or path-alias imports.

<!-- effect-solutions:start -->

## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.
<!-- effect-solutions:end -->

## Local Effect Source

The Effect v4 source reference is at
`~/.local/share/effect-solutions/effect`. Search it for implementations, types,
and examples when the guides are insufficient. This shared checkout may contain
local changes; never reset, overwrite, or update it without checking its status.

## Local Foldkit Source

Foldkit is kept outside this project's Git repository at
`~/.local/share/effect-solutions/foldkit`, alongside Effect. Use it for canonical
conventions, framework source, examples, and skills. References in upstream skills
to `repos/foldkit/` mean this shared checkout; do not vendor it into the project.

For a new machine, create the reference checkout:

```sh
git clone --depth 1 --branch 'foldkit@0.170.0' https://github.com/foldkit/foldkit.git ~/.local/share/effect-solutions/foldkit
```

Keep its revision aligned with the installed `foldkit` package (currently
`0.170.0`, upstream commit `a471adb24d750ab9e8d8312edad53ff6f26d961b`). After a
package upgrade, check the shared checkout's status before fetching and checking
out the matching `foldkit@<version>` tag. Preserve local changes and account for
other projects using this shared checkout.
