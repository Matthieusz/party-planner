# Effect v4 and Atoms migration plan

## Status

Phase 0 is complete. Its baselines, pinned versions, validation findings, constraints, and go decision are recorded in [the Phase 0 report](./effect-v4-atoms-phase-0.md). No production implementation, dependency, compiler, or runtime changes have been made.

## Objective

Migrate Party Planner incrementally to:

- an Effect v4 application core and backend runtime;
- schema-backed contracts and typed failures shared across server and browser boundaries;
- Effect Atoms for frontend server state, asynchronous workflows, and live invalidation;
- the existing React, TanStack Start, TanStack Router, Better Auth, Drizzle, PostgreSQL, and evlog capabilities unless a migration phase explicitly replaces an integration.

The migration must preserve the domain rules in `CONTEXT.md` and the accepted decisions in `docs/adr/` throughout. In particular, every business operation remains venue-scoped, Coordinator authority remains assignment-based, and live updates remain limited to the operational core.

## Scope

This migration applies to `apps/server`, `apps/web`, the non-documentation packages under `packages/`, and the root wiring required by those workspaces.

`apps/fumadocs` is explicitly out of scope. Do not add Effect dependencies, Atoms, providers, compiler plugins, configuration, source changes, or migration tests there. Migration-specific TypeScript changes must be scoped so they do not alter the Fumadocs application. Workspace lockfile changes caused by dependencies elsewhere are acceptable, but they do not make Fumadocs part of the migration.

## Current architecture

| Concern               | Current implementation                                      | Migration implication                                                                                                                                         |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend host          | Hono on Node                                                | Replace Hono completely with the Effect Node HTTP server and Effect HTTP routing.                                                                             |
| API                   | oRPC with Zod contracts and OpenAPI                         | Replace oRPC directly with Effect `HttpApi`; no compatibility endpoint or dual transport is required.                                                         |
| Business logic        | oRPC handlers call Drizzle directly                         | Move rules into Effect services; handlers become transport adapters.                                                                                          |
| Database              | Pre-v1 Drizzle with a module-level client                   | Upgrade to Drizzle v1 RC and use its native Effect support for acquisition, queries, transactions, and typed composition.                                     |
| Authentication        | Better Auth with a Drizzle adapter                          | Keep Better Auth; wrap session and authorization calls at an Effect adapter boundary.                                                                         |
| Runtime configuration | `@t3-oss/env-core`, Zod, and module-level environment reads | Move server runtime configuration to Effect `Config` in layers. Browser-public configuration remains explicitly separated.                                    |
| Frontend server state | TanStack Query through `@orpc/tanstack-query`               | Replace it directly with Effect Atoms and `AtomHttpApi`; do not introduce a coexistence layer.                                                                |
| Frontend local state  | React state                                                 | Keep component-local ephemeral state in React; do not turn every value into an Atom.                                                                          |
| Live updates          | ADR-0003 specifies SSE-driven TanStack Query invalidation   | Keep SSE and invalidation semantics, replacing query-key invalidation with Effect reactivity keys.                                                            |
| Logging               | evlog at Hono and TanStack Start boundaries                 | Preserve wide-event logging while replacing the Hono integration with an Effect HTTP boundary and bridging Effect logs, spans, and typed failures into evlog. |
| Tests                 | Vitest                                                      | Add `@effect/vitest` for Effect workflows while retaining Testing Library for React behavior.                                                                 |

The current API and database domain surface is still mostly starter `todo` functionality. This makes an early architectural migration less expensive, but the migration must not encode starter vocabulary into the Party Planner domain.

## Target architecture

### Package responsibilities

Keep the monorepo structure recognizable and change responsibilities incrementally:

```text
apps/
├── server/       # Node entry point and assembled production runtime
└── web/          # TanStack Start, Router, React, Atom registry and hydration
packages/
├── api/          # HttpApi contracts, transport handlers, and boundary error mapping
├── auth/         # Better Auth adapter plus Effect session/authorization services
├── db/           # Drizzle schemas, database layer, repositories, migrations
├── domain/       # Optional new package, created only when shared domain schemas justify it
├── env/          # Browser-public configuration during transition
└── ui/           # Presentation primitives, independent of server-state technology
```

Do not create `packages/domain` merely to mirror folders. Create it when at least one schema or rule is genuinely shared by backend services and the frontend. Otherwise, keep a domain module beside its owning service and export only its public contract.

### Backend flow

```text
Node runtime
  -> HTTP middleware (request identity, CORS, logging)
  -> Effect HttpApi handler
  -> request/session context
  -> application service
  -> authorization policy
  -> repository or external adapter
  -> Drizzle/PostgreSQL or Better Auth
```

Rules:

- HTTP handlers decode input, obtain request context, invoke one application operation, and map typed errors to transport responses.
- Application services own workflows and domain rules.
- Repository methods require a `VenueId` or an already-authorized venue context. Unscoped business reads are not part of repository interfaces.
- Better Auth remains the identity and membership authority. Domain code receives Staff and Venue concepts from an adapter rather than Better Auth row shapes.
- Provider and network calls do not run inside authoritative database transactions.
- The runtime layer is assembled once in `apps/server`; feature modules do not scatter `Effect.provide` calls.

### Effect modeling conventions

- Use `Schema.Struct` with same-name interfaces for records.
- Use constrained branded schemas for identifiers such as `VenueId`, `StaffId`, `ClientId`, `BookingId`, and `FunctionId`.
- Preserve encoded storage and transport names deliberately. The UI may say Event and Session while persistence continues to use `booking` and `function`.
- Use `Schema.TaggedUnion` for boundary-crossing variants and `Data.TaggedEnum` for internal workflow state.
- Use `Schema.TaggedErrorClass` for expected failures such as `NotFound`, `Forbidden`, `Conflict`, and persistence failures.
- Decode unknown HTTP payloads and non-trivial persisted values at boundaries. Do not cast around decoding.
- Define public and non-trivial internal operations with `Effect.fn("Domain.operation")`.
- Define application services with `Context.Service`; build real implementations with `Layer.effect` and return `Service.of({ ... })` unless a more specific layer constructor is truthful.
- Read server configuration with `Config`; use `Config.redacted` for credentials, `Config.schema` for refined values, and `Config.withDefault` only for missing-value defaults.
- Use `Stream` for SSE and other multi-value, interruptible sources. Use `PubSub` when every connected Staff subscriber must receive each event, and expose streams rather than producer primitives from service interfaces.
- Use `Schedule` for bounded retry, reconnect, polling, and backoff instead of hand-written sleep loops.
- Use Effect `Cache` for backend keyed TTL caching and concurrent lookup deduplication when required; do not build request-local or hand-rolled TTL maps.

### API and client integration

Use Effect `HttpApi` as the target transport contract and `AtomHttpApi.Service` as the target browser client integration. This is preferred over introducing Effect RPC because the repository already exposes HTTP/OpenAPI, requires ordinary Better Auth HTTP routes, and has an SSE endpoint.

The target contract should provide:

- schema-derived request, response, and expected-error types;
- generated HTTP clients;
- OpenAPI output for supported endpoints;
- `AtomHttpApi` query and mutation atoms;
- stable reactivity keys shared by mutations and SSE invalidation.

Replace the starter oRPC surface in one coordinated cutover. Define the Effect contracts, handlers, and Atom clients together, update all current consumers, then remove oRPC and Hono in the same phase. Do not create compatibility prefixes, dual transports, or temporary duplicate handlers.

### Frontend state ownership

Use Atoms selectively:

| State                                  | Owner                                           |
| -------------------------------------- | ----------------------------------------------- |
| Route location and search parameters   | TanStack Router                                 |
| Server resources and mutation state    | Effect Atoms through `AtomHttpApi`              |
| SSE connection and invalidation stream | Effect Atom/Stream integration                  |
| Shared cross-component workflow state  | Atoms when a real shared lifecycle exists       |
| Form field state                       | Existing form library or local React state      |
| Ephemeral component state              | React state                                     |
| Durable server truth                   | Backend and PostgreSQL, never the Atom registry |

Each browser app tree receives a `RegistryProvider`. SSR must create request-scoped Atom state, dehydrate only serializable schema-backed atoms, and hydrate through `HydrationBoundary`. A module-global registry must not leak state between server requests.

Queries use domain-oriented reactivity keys, for example:

```text
["venue", venueId, "bookings"]
["venue", venueId, "booking", bookingId]
["venue", venueId, "function", functionId]
["venue", venueId, "function", functionId, "menu"]
["venue", venueId, "function", functionId, "assignments"]
```

Mutations invalidate the narrowest truthful keys. SSE messages carry enough venue-scoped resource identity to invalidate the same keys. The client refetches authoritative data rather than merging arbitrary server patches, preserving ADR-0003.

## Migration principles

1. **Prove one complete slice.** Design one read/write workflow from contract through UI first, then cut the starter transport and frontend data stacks over together.
2. **One authoritative business implementation.** Effect HttpApi handlers delegate to Effect services; transport handlers do not own business rules.
3. **Direct replacement over compatibility.** This is starter code, so replace Hono and oRPC in one coordinated cutover rather than carrying dual transports.
4. **Use native integrations deliberately.** Use Drizzle v1 RC's native Effect support while keeping Better Auth behind an application adapter.
5. **Typed expected failures, visible defects.** Recover only where a boundary has a truthful response.
6. **Request and venue isolation are release blockers.** No migration phase may weaken tenancy or SSR isolation.
7. **Pin unstable packages together.** `effect` and `@effect/atom-react` must be tested and upgraded as a compatible set while v4 Atoms remain beta/unstable.

## Phased plan

### Phase 0: validate foundations and record baselines

**Completed:** 2026-07-17. See [the Phase 0 report](./effect-v4-atoms-phase-0.md).

**Work**

- Record baseline results for build, type checking, tests, API smoke tests, authentication, and one frontend SSR request.
- Confirm the Node and deployment target support the selected Effect platform runtime.
- Build a disposable validation spike for Effect v4, `@effect/atom-react`, TanStack Start SSR, and `AtomHttpApi`; do not merge the spike into production architecture.
- Verify request-scoped Atom registry creation, serialization, hydration, authenticated cookies, interruption on unmount, and no cross-request data leakage.
- Verify the selected Drizzle v1 RC release's native Effect API against its pinned source, including PostgreSQL acquisition, transactions, interruption, cleanup, and Better Auth adapter interoperability.
- Confirm how Effect logs/spans enter evlog without duplicate request events.

**Exit criteria**

- A version pair is pinned and documented.
- The SSR/hydration spike passes two concurrent requests with different authenticated identities and no state crossover.
- A written go/no-go decision exists for `AtomHttpApi`. If it is not viable, retain the Effect backend plan and pause the frontend server-state replacement rather than inventing an unchecked bridge.

### Phase 1: configure Effect tooling

This phase requires explicit approval before changing dependencies, TypeScript configuration, or agent instruction files.

**Work**

- Add `effect` to packages containing contracts or workflows.
- Add the current Effect Node platform package to `apps/server`.
- Add `@effect/atom-react` to `apps/web`.
- Add `@effect/vitest` where Effect tests live.
- Upgrade database dependencies to the selected Drizzle v1 RC and its required PostgreSQL integration packages without changing Fumadocs dependencies.
- Install and configure the Effect language service according to `effect-solutions show project-setup`.
- Compare the applicable TypeScript configs with `effect-solutions show tsconfig`; apply compatible strict options without weakening current checks or modifying the Fumadocs configuration.
- Keep the existing `check-types` Turbo pipeline and make language-service patching reproducible for clean installs and CI.
- Add Effect guidance to agent instruction files only after separate confirmation.

**Exit criteria**

- Clean install, build, type check, and existing tests pass.
- The Effect language service reports diagnostics in the editor and CLI workflow.
- No application behavior changes.

### Phase 2: establish domain contracts and application services

**Completed:** 2026-07-17. The first vertical slice is the venue-scoped operational Session read service in `packages/api/src/session`, with schema-backed contracts, repository and authorization ports, ADR-0005 status derivation, and explicit-layer service tests. Transport and persistence adapters remain Phase 3 and Phase 4 work.

**First vertical slice:** replace the starter todo slice or implement the first real Party Planner read-only slice. Prefer a real, venue-scoped read such as the operational Session list if its product behavior is ready; otherwise use the starter slice only as disposable migration scaffolding.

**Work**

- Define branded identifiers, request/response records, and typed expected errors with Effect Schema.
- Define a service contract first, then test it with explicit layers.
- Model `currentStatus(session, now)` as a pure domain function using Effect `Clock` at the service boundary, preserving ADR-0005.
- Introduce explicit authorization policy operations for role and assignment checks.
- Keep transport types out of application service interfaces. Drizzle's native Effect values remain inside persistence modules and repository implementations.

**Exit criteria**

- Service tests cover success, validation, venue isolation, role authorization, assignment authorization where relevant, and expected failures.
- No handler contains duplicated business rules.
- Domain vocabulary matches `CONTEXT.md`.

### Phase 3: wrap persistence, auth, config, and observability

**Completed:** 2026-07-17. Server configuration now loads through a validated Effect `Config` service; application persistence uses scoped `@effect/sql-pg` and Drizzle Effect acquisition; Better Auth owns a separately scoped conventional pool and resolves active-Venue Staff identity through a named adapter effect; the Session repository is venue-scoped and decodes persisted rows; and the HTTP boundary enriches the existing evlog request event with Effect operation outcomes without emitting a duplicate completion event. The initial schema migration adds Better Auth organization membership plus the Session/assignment persistence needed by the vertical slice.

**Work**

- Upgrade `packages/db` to Drizzle v1 RC and replace the module-level singleton with Drizzle's native Effect acquisition and lifecycle APIs.
- Build repository services on the native Effect query and transaction surface with venue-scoped methods; map persistence failures to typed adapter errors only at boundaries where the native error is not an intentional public contract.
- Decode non-trivial rows before returning domain values.
- Wrap Better Auth session lookup and membership/active-venue resolution in named effects.
- Represent request identity as an explicitly provided request service or middleware context, never as a global mutable value or a defaulted `Context.Reference`.
- Move server configuration reads into Effect `Config` layers. Treat environment and `.env` providers as startup boundaries, keep browser-public `VITE_` configuration separate, and never expose server secrets to the browser bundle.
- Test config decoding with `ConfigProvider.fromUnknown`; provide an already-decoded application config service directly when decoding is not under test.
- Add spans and structured annotations at service and adapter boundaries; bridge them to evlog.

**Exit criteria**

- Resources close on runtime shutdown and tests can replace every adapter with a layer.
- Every business query is venue-scoped by construction.
- Auth, configuration, persistence, and logging failures have intentional boundary mappings.

### Phase 4: replace the transport and frontend data stacks

**Completed:** 2026-07-17. The venue-scoped Session read slice now uses schema-derived Effect `HttpApi` contracts and thin handlers, the Node process is hosted by the Effect HTTP server, Better Auth is mounted through the Effect router, OpenAPI and Scalar reference routes are generated from the contract, and request completion remains a single evlog wide event. The web application now owns a request-scoped Atom registry and hydration boundary plus a credential-preserving `AtomHttpApi.Service` client. Starter todo/private-data consumers were removed together with Hono, oRPC, TanStack Query, their integrations, and their runtime dependencies.

**Work**

- Define an Effect `HttpApi` group for the vertical slice.
- Implement thin handlers that call the Phase 2 service.
- Run the server through the Effect Node HTTP server and Effect HTTP routing; remove Hono completely.
- Mount the Better Auth Web handler through the Effect HTTP boundary and verify its cookies, trusted origins, and error behavior.
- Preserve cookie credentials, CORS behavior, request identity, and evlog request completion.
- Generate and inspect OpenAPI output before replacing the existing reference endpoint.
- Add transport tests for decoding, expected errors, auth, and venue isolation.
- Add a request-safe `RegistryProvider`, SSR hydration boundary, and `AtomHttpApi.Service` client to `apps/web`.
- Update every current web consumer to Effect query and mutation atoms as part of this coordinated cutover. Starter-only routes may be deleted instead of migrated.
- Remove Hono, oRPC, TanStack Query, their devtools and SSR integration, client utilities, handlers, packages, and generated assumptions in the same phase.

**Exit criteria**

- Hono, oRPC, and TanStack Query are absent from runtime dependencies and source imports outside historical documentation.
- The Effect transport preserves the required behavior of the starter endpoints that remain relevant.
- API contract and handler tests pass without a live network server where practical.

### Phase 5: harden the Atom frontend

**Completed:** 2026-07-17. The authenticated dashboard now reads the venue-scoped Session collection through a schema-derived, credential-preserving `AtomHttpApi` query with a stable reactivity key, serialization key, and 30-second idle TTL. Its React boundary renders initial loading, stale-while-refreshing data, success, expected failure with retry, interruption, and defects intentionally. Registry tests cover repeated-write interruption, matching-key invalidation, TTL retention and cleanup, and isolated dehydration/hydration; component tests cover the user-visible asynchronous states and retry behavior.

**Work**

- Configure an Effect HTTP client that preserves credentials and targets the Effect API prefix. Keep request construction, status classification, and Schema decoding inside the client boundary; use raw `fetch` only if a verified browser/platform constraint requires a small adapter.
- Render all `AsyncResult` states intentionally: initial, waiting with or without previous data, success, expected failure, and interruption where user-visible.
- Test mutation interruption, repeated writes, stale data display, navigation, SSR hydration, and retry UX.
- Validate reactivity-key invalidation, TTL behavior, interruption, and cleanup against the pinned Atom implementation.

**Exit criteria**

- The web application has no Hono, oRPC, or TanStack Query dependency.
- SSR does not double-fetch the hydrated query during the agreed freshness window.
- Browser navigation and concurrent SSR tests show no registry leakage.

### Phase 6: migrate SSE invalidation

**Completed:** 2026-07-17. PostgreSQL `LISTEN/NOTIFY` now feeds a scoped, broadcast Effect event source; the authenticated SSE route filters every stream to the active Venue and exposes only the operational-core resource variants. The dashboard owns and releases its credentialed `EventSource`, reports connection state, uses bounded jittered reconnects, and refetches authoritative Session data through Atom invalidation rather than merging patches. ADR-0003 now names Effect reactivity keys and `HttpApi`.

**Work**

- Implement the server event source as a scoped `Stream` backed by Postgres `LISTEN/NOTIFY` or the selected outbox design.
- If one database listener fans out to multiple SSE consumers, keep a private `PubSub` in the adapter and expose `Stream.fromPubSub`-backed streams so every authorized subscriber receives every event.
- Fork long-lived server consumers with `Effect.forkScoped` within the owning layer scope; do not run a forever consumer inline during layer acquisition.
- Expose venue-authorized SSE for only `function`, `menu`, `function_assignment`, and `booking` changes.
- Wrap browser `EventSource` lifecycle as an interruptible stream/atom adapter.
- Translate each message to shared reactivity-key invalidation.
- Add bounded, jittered reconnect/backoff with `Schedule` and connection-state UX. Retry only typed transient failures and preserve exhausted failures when there is no truthful fallback. Do not add polling as an unrecorded fallback.
- Preserve refetch-on-invalidation rather than patch merging.

**Exit criteria**

- Disconnecting or unmounting releases listeners and fibers.
- A Staff member cannot subscribe to another Venue's events.
- Duplicate, delayed, and reconnect events remain safe because invalidation is idempotent.
- ADR-0003 is amended at cutover to name Effect reactivity keys instead of TanStack Query keys.

### Phase 7: migrate remaining vertical slices

**Completed:** 2026-07-17. A repository-wide migration inventory found no remaining production vertical slices to cut over. The only implemented server-backed business slice was the venue-scoped operational Session read path, which was migrated end to end in Phases 2–6. The other entries below describe future Party Planner product delivery, not legacy Hono/oRPC/TanStack Query implementations; building them solely to satisfy a stack migration would expand product scope and violate the migration's minimal-change principle. Static representative dashboard data is component-local presentation data and does not constitute a server-state slice. Phase 8 retains ownership of starter schema and stale configuration cleanup.

Suggested implementation order for future product slices:

1. read-only Venue, Room, and Client views;
2. Booking/Event and Function/Session reads;
3. Booking and Function writes plus assignment authorization;
4. Menu and Menu Template workflows, including deep-copy behavior from ADR-0004;
5. operational live views and needs-attention derivations;
6. administrative and historical views.

For each slice:

- define or reuse schemas;
- implement/test the service and authorization policy;
- implement repository adapters;
- expose HttpApi handlers;
- move the frontend to Atoms;
- add SSE invalidation only if the collection is in ADR-0003;
- remove the old route after observability confirms the new path.

Do not create generic base repositories, generic CRUD services, or a universal error type. Keep modules aligned with domain operations.

### Phase 8: final cleanup

**Work**

- Remove Zod only where it no longer supports Better Auth, a third-party integration, or transitional environment validation.
- Replace starter todo artifacts with real domain modules.
- Update README architecture and ADR-0003 to describe the completed state.

**Exit criteria**

- Dependency and import searches show no Hono, oRPC, TanStack Query, or accidental transitional stack usage outside historical documentation.
- Clean install, build, type check, tests, auth smoke tests, API smoke tests, SSR, and SSE tests pass.
- Production telemetry shows no unexplained increase in errors, latency, connection count, or duplicate requests.

## Testing strategy

### Domain and services

- Pure tests for status and authorization decisions.
- `@effect/vitest` `it.effect` tests with per-test layers for service workflows; use `it.live` only when real runtime services are the behavior under test.
- Deterministic `TestClock` coverage for Session status and reconnect schedules, forking delayed effects before advancing time.
- `Deferred`, `Queue`, `Latch`, or explicit test hooks for concurrent behavior; no arbitrary sleeps.
- Assertions for typed failures, interruption, finalization, retry bounds, idempotency, and malformed persisted values where relevant.

### Persistence and tenancy

- Repository contract tests against PostgreSQL for transactions and mappings.
- Negative tests proving cross-Venue reads and writes are impossible.
- Menu Template deep-copy tests proving future template edits do not change Session Menus.

### HTTP and auth

- Request decoding and response encoding tests.
- Expected-error-to-status mappings.
- Cookie/session propagation and active Venue resolution.
- OpenAPI snapshots or semantic checks for public contract drift.

### Atoms and React

- Registry-level tests for query caching, mutation invalidation, interruption, and TTL behavior.
- React tests through `RegistryProvider` for all meaningful `AsyncResult` states.
- SSR dehydration/hydration tests with concurrent request isolation.
- Route tests for Atom provider scope, hydration, navigation, and error rendering.

### SSE

- Stream lifecycle and cleanup tests.
- Venue authorization tests.
- Reconnect tests with deterministic time.
- Idempotent invalidation tests for duplicate events.

## Deployment and rollback

- Cut over the Effect server and its current web consumers together; do not deploy a mixed Hono/oRPC and Effect transport state.
- Roll back the coordinated application release if necessary; do not add a permanent runtime switch or dual transport solely for rollback.
- Avoid schema changes solely for the Effect migration. If a domain schema migration is required, deploy it backward-compatibly before moving traffic.
- Add release dashboards or queries for request failure tags, latency, database pool usage, SSE connections/reconnects, and client duplicate-fetch counts.

## Risks and mitigations

| Risk                                                 | Mitigation                                                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Effect v4 and Atoms APIs are beta/unstable           | Pin compatible versions, upgrade together, keep Phase 0 as a hard gate, and consult current installed source before each migration phase.             |
| TanStack Start SSR integration is not turnkey        | Prototype request-scoped registry and hydration before production work; test concurrent identities.                                                   |
| Auth behavior changes while replacing Hono           | Keep Better Auth unchanged and contract-test its Effect HTTP mounting, cookies, CORS, trusted origins, and session resolution.                        |
| Drizzle v1 RC APIs change before stable release      | Pin one RC, inspect its native Effect source, add persistence contract tests, and upgrade only deliberately.                                          |
| Venue scoping is lost in generic repositories        | Make venue identity mandatory in service/repository contracts and add negative integration tests.                                                     |
| Typed errors become an indiscriminate catch-all      | Define errors at truthful domain/adapter boundaries and let defects remain visible.                                                                   |
| SSE fibers or listeners leak                         | Own them in scoped layers/atoms and test finalizers on disconnect and unmount.                                                                        |
| The coordinated cutover makes a broad change at once | Keep the starter surface small, prove the complete slice in Phase 0, and require build, auth, SSR, API, and Atom tests before merging the cutover.    |
| Existing product docs disagree on offline support    | Treat `CONTEXT.md` and ADR-0003 as authoritative: MVP is online only. Offline support requires a separate decision and is not part of this migration. |

## Decisions to make at phase gates

These do not block writing the plan, but implementation must resolve them at the named phase:

1. **Phase 0:** exact Effect v4 and `@effect/atom-react` versions.
2. **Phase 0:** production deployment/runtime target and whether long-lived SSE is supported there.
3. **Phase 0:** SSR integration shape and dehydration ownership in TanStack Start.
4. **Phase 0:** exact Drizzle v1 RC and native Effect integration API, verified against pinned source.
5. **Phase 6:** Postgres `LISTEN/NOTIFY` versus an outbox. This must preserve ADR-0003 semantics.

## Documentation and source policy

Before implementing any phase:

1. Run `effect-solutions list`.
2. Read relevant guides with `effect-solutions show <topic>...`.
3. Inspect the project-pinned `effect` package source.
4. Use the shared v4 source at `~/.local/share/effect-solutions/effect` when the installed package does not answer the question.
5. Load the globally available `$effect` skill and read only the branch references applicable to the phase: Schema, services/layers, config, scheduling, caching, streams, HTTP clients, and testing as needed.
6. Do not copy examples blindly: confirm APIs against the version pinned by this repository.

Primary Effect Solutions topics for this migration are `project-setup`, `tsconfig`, `basics`, `services-and-layers`, `data-modeling`, `error-handling`, `config`, and `testing`. The `$effect` skill remains the project engineering guide. Atoms and HttpApi additionally require source inspection because their v4 modules are unstable.

## Definition of done

The migration is complete when:

- backend workflows are Effect services with explicit layers, schemas, errors, and tests;
- HTTP contracts and handlers use Effect HttpApi;
- the server runs on the Effect Node HTTP server with no Hono or oRPC runtime dependency;
- Better Auth is isolated behind an Effect adapter and Drizzle v1 RC uses its native Effect integration;
- server configuration uses Effect Config;
- frontend server state and asynchronous mutations use Effect Atoms;
- SSR Atom state is request-scoped and safely hydrated;
- SSE invalidates Effect reactivity keys for the operational core;
- Hono, oRPC, and TanStack Query code is removed in the coordinated cutover;
- `apps/fumadocs` remains unchanged by the migration;
- tenancy, authority, status, and Menu Template decisions remain enforced;
- build, type checks, tests, auth, SSR, and live updates pass from a clean install;
- README and ADR-0003 describe the final architecture rather than the transitional one.
