# Anti-slop provenance

- Source repository: https://github.com/dmmulroy/anti-slop
- Installed from: the local install-anti-slop skill's bundled
  `assets/anti-slop/`, copied with its `scripts/install.mjs`.
- Exact upstream commit: unknown. This bundle is older than the upstream README
  inspected during setup; do not identify it as current upstream HEAD.
- Pristine copied-file identities: `UPSTREAM.sha256` records SHA-256 hashes
  relative to this directory for every file in the original bundle.
- Entry points: `index.ts` (17 generic rules) and `effect/index.ts`
  (the opt-in `no-service-constructor-imports` rule).
- Intentional source deviations: none. Only this provenance file and the
  checksum manifest were added, along with the MIT LICENSE retrieved from
  the upstream repository (the local skill bundle omitted it).
- Configuration enables every rule provided by this bundle plus native
  `oxc/no-accumulating-spread`.
- Newer upstream rules are not included in this snapshot. Upgrade deliberately,
  preserving local changes and reviewing any newly introduced policy.

Verify the unchanged bundle from this directory with:
`sha256sum --check UPSTREAM.sha256`.
