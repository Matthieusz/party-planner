# Effect v4 and Atoms migration: phase 0 findings

Date: 2026-07-17

## Decision

**Go for the Effect backend and `AtomHttpApi` frontend migration, with the constraints below.**

The validated version set is pinned for Phase 1 as:

| Package                 | Version         |
| ----------------------- | --------------- |
| `effect`                | `4.0.0-beta.99` |
| `@effect/atom-react`    | `4.0.0-beta.99` |
| `@effect/platform-node` | `4.0.0-beta.99` |
| `@effect/sql-pg`        | `4.0.0-beta.99` |
| `drizzle-orm`           | `1.0.0-rc.4`    |
| `drizzle-kit`           | `1.0.0-rc.4`    |

Use exact versions, not ranges or dist-tags. Upgrade the Effect packages as one set. Phase 1 must install these only in migration workspaces; `apps/fumadocs` remains out of scope.

## Baseline

Environment:

- Node `v24.18.0`
- pnpm `11.7.0`
- Linux x86_64 under WSL2
- current server output is a Node ESM bundle
- current web output includes a TanStack Start server bundle

| Check                | Result | Notes                                                                                                                                              |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`         | Pass   | 3 build tasks passed. Existing warnings: large web/Fumadocs chunks, deprecated tsdown `noExternal`, missing Turbo output declaration for Fumadocs. |
| `pnpm check-types`   | Pass   | 8 tasks passed.                                                                                                                                    |
| `pnpm test`          | Pass   | 2 files and 5 tests passed.                                                                                                                        |
| `pnpm check`         | Pass   | Ultracite reported all 324 matched files formatted.                                                                                                |
| API root             | Pass   | Built server returned `200 OK` from `/`.                                                                                                           |
| OpenAPI reference    | Pass   | `/api-reference` returned 200.                                                                                                                     |
| Authentication smoke | Pass   | `/api/auth/get-session` returned `200` and `null` for an anonymous request.                                                                        |
| Frontend SSR         | Pass   | Built preview returned 200, 31,554 bytes, and the expected `Party Planner` title.                                                                  |

The smoke checks used test-only environment values and did not mutate the database. A signed-in production-equivalent authentication flow requires a seeded PostgreSQL fixture and belongs in the Phase 3/4 auth contract suite.

## Disposable spike

The spike was built outside the repository in `/tmp/party-planner-phase0`; no spike source or dependency was merged into application architecture.

It used the exact versions above and passed these assertions:

1. two concurrent SSR renders received separate Atom registries;
2. cookie-derived identities `alice` and `bob` serialized and hydrated independently;
3. neither identity appeared in the other render;
4. disposal of a mounted effect-backed Atom interrupted its effect and ran its finalizer;
5. `AtomHttpApi.Service` constructed against a schema-backed `HttpApi` and exposed typed query and mutation factories.

Source inspection additionally confirmed:

- `RegistryProvider` creates its registry in a component-local ref and disposes it after unmount;
- `Hydration.dehydrate` includes only `Atom.serializable` nodes;
- `AtomHttpApi` query serialization uses the endpoint success/error schemas and a caller-provided serialization key;
- mutations accept reactivity keys and queries can subscribe to the same keys;
- schema and HTTP-client decoding failures are treated as defects rather than endpoint failures.

### SSR integration shape

TanStack Start must create the registry while constructing each request's router context. The root tree should receive that registry explicitly through `RegistryContext.Provider` (or an equivalent request-owned wrapper), with `HydrationBoundary` inside it. Do not rely on the module-level default registry exported by `@effect/atom-react`, and do not create a module-global application registry.

Only schema-backed atoms with stable serialization keys may be dehydrated. Authentication cookies stay in the request/HTTP client boundary and are not serialized into Atom state.

## Node and deployment target

Effect Platform Node supports the repository's current Node 24 runtime. The current build and local server model are persistent Node processes, which can own scoped resources and long-lived SSE connections.

No production deployment manifest is present in the repository. The migration therefore requires a persistent Node deployment target. A request-isolated serverless target that terminates work after a response is **not approved** for the Phase 6 SSE design. The deployment platform must be recorded before Phase 6 begins.

## Drizzle v1 RC findings

`1.0.0-rc.4` is selected instead of the currently catalogued `1.0.0-rc.3` because RC.4 declares Effect v4 peer compatibility and contains the PostgreSQL Effect driver.

Pinned-source inspection found:

- `drizzle-orm/effect-postgres` obtains `PgClient` from `@effect/sql-pg`;
- `makeWithDefaults` supplies Drizzle's Effect logger/cache services while leaving PostgreSQL acquisition to the `PgClient` layer;
- PostgreSQL queries are Effect values and expose `EffectDrizzleQueryError`;
- transactions delegate to `PgClient.withTransaction` and preserve typed transaction failures;
- interruption and pool cleanup are owned by `@effect/sql-pg` scopes rather than a Drizzle-created global pool.

Better Auth's Drizzle adapter expects the conventional promise-based Drizzle database. It must **not** receive the Effect-native database value. During migration, Better Auth may acquire its own conventional Drizzle client/pool inside the auth adapter layer, while application repositories use `drizzle-orm/effect-postgres`. Both must share schema definitions and database configuration, but not client types or lifecycles. Phase 3 must prove both pools close during layer shutdown and must add live PostgreSQL transaction/interruption tests.

## evlog integration

There is no first-party evlog Effect logger integration in the installed `evlog@2.19.1` package. The approved boundary is:

- one evlog request logger owns and emits the request completion wide event;
- Effect logs, span annotations, and typed failure tags enrich that request logger through a small adapter;
- the Effect logger adapter must not emit another request-completion event;
- background fibers without a request owner emit separate operation events;
- trace/span identifiers may use evlog's existing trace-context fields.

This avoids retaining both `evlog/hono` and a second Effect request logger after the transport cutover.

## Gate constraints for later phases

- Phase 1 requires the explicit dependency/configuration approval called for by the migration plan.
- Install the exact version set above and inspect pinned source again after installation.
- Add live PostgreSQL lifecycle tests before replacing the current database singleton.
- Add a seeded signed-in cookie test before replacing the auth/HTTP boundary.
- Record the production host before implementing long-lived SSE.
- Pause the Atom frontend migration if a later pinned-source or integration test invalidates the request-scoped registry or `AtomHttpApi` assumptions; do not add a compatibility bridge.
