# Event-plan implementation plan

Status: ready for implementation, following the product and implementation-design interview on 2026-11-02. This is a plan for intended behavior, not a statement that the capabilities exist. No deployment is included.

## Summary

Build a shared event-plan and handoff tool for a manually configured one-hotel pilot. Marketing prepares drafts, publishes numbered revisions, and distributes the common printout. Kitchen and service staff reference published instructions, request corrections, and confirm receipt through designated leads. Reusable menu templates are included.

The source of product requirements is [PRODUCT.md](../PRODUCT.md); terminology is in [GLOSSARY.md](../GLOSSARY.md). [ADR 0001](./adr/0001-explicit-publication-for-printed-plans.md) explains explicit publication for paper-based service. The decisions from the completed interview are incorporated below; there are no outstanding product questions blocking implementation.

## Context and current state

Verified during planning; authentication context updated after the fresh Better Auth replacement:

- Alchemy's Better Auth integration provides email/password authentication and D1 sessions over same-origin HTTP. The former custom password screening and token buckets are not preserved.
- `backend/identity/current-identity.ts` supplies authenticated identity only. It explicitly does not establish venue membership or permission.
- Better Auth owns its managed auth schema; there are no operational tables or application-owned migration files yet.
- `backend/api.ts`, `backend/http.ts`, and `backend/worker.ts` provide the Effect HTTP API and request-scoped D1 runtime.
- `frontend/src/app/main.ts` owns application orchestration, the document, and the empty signed-in operational shell. `frontend/src/identity/` owns authentication behavior and forms, connected through Foldkit child messages and OutMessages. Commands are runtime-owned; update and view are pure.
- The fresh `BetterAuthDb` resource replaces the previous auth store without importing users or sessions. Alchemy manages Better Auth's migrations; introduce explicit application schema/migration ownership for operational data.
- D1 supports atomic batches, not interactive SQL transactions. Any future ORM exposing a transaction method does not establish D1 support.
- Bun is the package manager; Vitest through `vp test` is the test runner. Tooling is defined in `vite.config.ts`, including `vp run check`, `vp run test`, and `vp run test:integration`.
- Installed versions include Effect 4.1.2 and Foldkit 0.170.0. Use installed APIs and the shared Foldkit checkout, not older version claims in prose documentation.

## Goals and non-goals

Deliver an event board, event-plan editing, publication history, shared printing, receipt tracking, correction requests, cancellation, and reusable menu templates. The initial version has one room per event, with activities that may run into later dates. Unknown operational details are allowed and visible.

Defer self-service hotel setup, invitations, automated notifications, continuous live updates, offline workflows, named guest lists, seating charts, live course tracking, client CRM, booking-sales pipelines, whole-event templates, automatic edit merging, multi-room events, department-specific print layouts, and reinstatement after cancellation.

Room allocation is part of the plan; this release does not implement a reservation/availability engine. Do not infer room exclusivity or reject events based on unknown service timings.

## Invariants

1. Authentication alone grants no venue access. All operational reads and writes are venue-scoped and authorized on the server.
2. Marketing controls drafts, publication, cancellation, and correction resolution. Kitchen maintains menu templates. All authenticated hotel staff can read published plans and submit corrections.
3. An event has one room. Activities inherit that room, default to the event's starting date, and may explicitly use a later date.
4. Unknown, confirmed absence, and provided information are distinct. Unknown attendance is distinct from zero. Approximate timing is distinct from exact timing.
5. Publication requires an event name, date, room, kitchen lead, and service lead. Other details may remain explicitly unknown and must be listed on the published plan.
6. A published revision is a fixed snapshot. Draft edits and later changes to staff names, room names, or templates cannot rewrite its contents.
7. Publication numbers increase within an event. Every new publication, including cancellation, needs fresh receipt confirmations for its own designated leads.
8. A receipt means that a specific lead received a specific revision, not that the plan is complete or approved. Direct and marketing-recorded confirmations have different attribution.
9. Template application copies content into a selected activity. Later template changes cannot update that copy. Adding and replacing dishes are explicit different operations.
10. Stale writes cannot overwrite newer drafts. Failed saves preserve the user's local unsaved input.
11. A correction stays open until marketing records its outcome; an unrelated publication cannot close it.
12. Cancellation ends planning. History and receipt recording remain available. Cancelling must not expose unpublished draft changes.
13. Retrying an accepted command cannot duplicate its effect. A command ID reused for different input is a conflict.
14. Draft prints are prominently unpublished, have no published revision number, and cannot receive receipts.

## Alternatives considered

| Option                                       | Interface and storage shape                                                                 | Strength                                                             | Cost                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Fully normalized plans                       | CRUD over activities, dishes, timings, and requirements; publication copies related rows    | SQL-level querying of each field                                     | Many coordinated writes and a larger mutable surface; snapshot invariants span many tables            |
| One document per event, including history    | Load and compare-and-swap the full event document                                           | Simple aggregate mutation                                            | Growing history documents; unrelated operations contend; dashboard and receipt queries become awkward |
| Relational records plus structured snapshots | Cohesive plan commands; relational heads and coordination records; draft/revision documents | Keeps publication history fixed while supporting event-board queries | Requires explicit codecs and an atomic publication operation                                          |

Use the third option. All options retain the existing runtime and auth stack. Event sourcing, workflow engines, queues, and a second database are unnecessary for a manually notified pilot.

## Domain model and types

Implement each domain module as more than a collection of schemas: keep its types,
parsers, invariants, and pure operations together, and expose those operations to
callers rather than repeating domain rules in adapters or UI code. In particular:

- Event Plan owns publication prerequisites, completeness, and legal transitions.
- Published Revision owns immutable snapshot values and readable revision changes;
  later edits to drafts or referenced records must not alter a snapshot.
- Menu Template owns the pure Add/Replace copy transformations, with fresh
  event-local IDs supplied by the caller rather than generated inside pure logic.
- Receipt Confirmation owns revision- and department-specific receipt meaning,
  including the distinction between direct and verbal attribution.

Keep SQL, HTTP, authorization, and atomic concurrency enforcement in the relevant
backend adapters and application workflows. Pure domain operations do not by
themselves prove persistence or access guarantees.

The following TypeScript is contract pseudocode. Implement values with constrained branded schemas, records with `Schema.Struct` and same-name interfaces, serialized variants with `Schema.TaggedUnion`, and expected failures with `Schema.TaggedError`, matching installed Effect APIs. Public operations require JSDoc. Do not implement unchecked brands or cast decoded rows.

Use distinct identifiers for `VenueId`, `StaffId`, `RoomId`, `EventId`, `ActivityId`, `FoodItemId`, `RevisionId`, `MenuTemplateId`, `CorrectionRequestId`, and `CommandId`. Keep `DraftVersion`, `TemplateVersion`, `CorrectionVersion`, and `RevisionNumber` distinct. Parse nonempty text, nonnegative integer counts, valid calendar dates, local times, IANA timezones, and UTC audit instants at their boundaries.

```ts
type Detail<A> =
  | { readonly _tag: "Unknown" }
  | { readonly _tag: "None" }
  | { readonly _tag: "Provided"; readonly value: A };

type Headcount =
  | { readonly _tag: "Unknown" }
  | { readonly _tag: "Known"; readonly count: NonNegativeInt };

type ActivityAttendance =
  | { readonly _tag: "UseEventCount" }
  | { readonly _tag: "Override"; readonly value: Headcount };

type ActivityDate =
  | { readonly _tag: "EventDate" }
  | { readonly _tag: "Explicit"; readonly date: LocalDate };

type Timing =
  | { readonly _tag: "Unknown" }
  | {
      readonly _tag: "Specified";
      readonly localTime: LocalTime;
      readonly precision: "Exact" | "Approximate";
    };

interface FoodItem {
  readonly id: FoodItemId;
  readonly name: NonEmptyText;
  readonly servingNotes: Detail<NonEmptyText>;
}

interface DietaryRequirement {
  readonly description: NonEmptyText;
  readonly mealCount: NonNegativeInt;
  readonly servingInstructions: Detail<NonEmptyText>;
}

interface Activity {
  readonly id: ActivityId;
  readonly name: NonEmptyText;
  readonly date: ActivityDate;
  readonly timing: Timing;
  readonly attendance: ActivityAttendance;
  readonly food: Detail<NonEmptyReadonlyArray<FoodItem>>;
}

interface PlanContent {
  readonly attendance: Headcount;
  readonly activities: ReadonlyArray<Activity>;
  readonly cake: Detail<NonEmptyText>;
  readonly guestSuppliedItems: Detail<NonEmptyText>;
  readonly specialRequests: Detail<NonEmptyText>;
  readonly dietaryNeeds: Detail<NonEmptyReadonlyArray<DietaryRequirement>>;
}
```

Order activities and dishes explicitly in their arrays, keeping stable IDs across edits so comparisons can identify moves, additions, removals, and edits. Preserve editorial order when timing is unknown; do not silently reorder the plan by guessed time. Cake timing belongs in its activity when known; the cake section carries its additional instructions.

Draft form strings may be incomplete. A draft-header parser represents unset name/date/room/leads explicitly; it does not brand empty form values as publishable. Operational completeness is derived from the plan, not stored as a hand-maintained boolean. `Provided` requires nonempty meaningful content; clearing it requires an explicit unknown/none choice.

```ts
interface PublishableHeader {
  readonly name: NonEmptyText;
  readonly date: LocalDate;
  readonly room: RoomReference;
  readonly kitchenLead: StaffReference;
  readonly serviceLead: StaffReference;
}

interface PublishedRevision {
  readonly id: RevisionId;
  readonly eventId: EventId;
  readonly number: RevisionNumber;
  readonly publishedAt: UtcInstant;
  readonly publishedBy: StaffReference;
  readonly kind: "Plan" | "Cancellation";
  readonly schemaVersion: PlanSchemaVersion;
  readonly header: PublishableHeader;
  readonly content: PlanContent;
  readonly changes: ReadonlyArray<PlanChange>;
}

type ReceiptSource =
  | { readonly _tag: "Direct"; readonly actor: StaffReference }
  | { readonly _tag: "Verbal"; readonly recordedBy: StaffReference };

interface ReceiptConfirmation {
  readonly revisionId: RevisionId;
  readonly department: "Kitchen" | "Service";
  readonly lead: StaffReference;
  readonly source: ReceiptSource;
  readonly recordedAt: UtcInstant;
}

type CorrectionOutcome =
  | { readonly _tag: "PublishedCorrection"; readonly revisionId: RevisionId }
  | { readonly _tag: "NoChangeNeeded"; readonly explanation: NonEmptyText };

type CorrectionState =
  | { readonly _tag: "Open" }
  | {
      readonly _tag: "Resolved";
      readonly outcome: CorrectionOutcome;
      readonly resolvedBy: StaffReference;
      readonly resolvedAt: UtcInstant;
    };
```

`RoomReference` and `StaffReference` pair stable IDs with display names captured in the revision. The published snapshot also captures the venue timezone and printable venue identity. `PlanChange` is a closed union for initial publication, changed header/section/activity/dish, additions/removals/reordering, and cancellation. It carries safe printable before/after values and stable paths; it is not an arbitrary JSON patch interpreted by the browser.

Keep these event transitions explicit:

```text
DraftOnly → Published → Published (next revision)
                     → Cancelled (cancellation revision)

Cancelled: no draft editing, template application, or further publication.
History and receipt recording remain available.
```

Corrections attach to the published revision the reporter viewed. Marketing explicitly resolves them with a published correction for the same event or an explanation. Existing open requests may be resolved with an explanation after cancellation; do not let this reopen planning.

## Venue access and pilot provisioning

Keep Better Auth identity separate from venue staffing. A venue-owned staff directory entry may have no auth subject, which allows a lead to exist without logging in. An authenticated membership links a subject to a staff entry in the venue. Never grant access because an email address or supplied venue ID happens to match.

Use two operational write capabilities: `ManagePlans` and `ManageMenuTemplates`. Marketing receives the former; kitchen template maintainers receive the latter. A member can have both. Reading published plans and submitting corrections require venue membership. Direct receipt confirmation additionally requires being the designated lead for that revision and department. Marketing may record verbal receipt for those designated leads, including leads without accounts.

Provide an explicit, idempotent Bun pilot-setup command for venue name/timezone, rooms, staff, subject links, and capabilities. Resolve existing auth subjects; do not insert password/session rows manually. Keep setup out of application import time and keep deployment as a separate action. Do not add a public membership-granting endpoint or full admin/invitation interface for this pilot. Open identity registration, if retained, must still grant no venue access.

Add a venue-access context after authentication; do not change `/api/me` to imply hotel authority. An inaccessible event/revision lookup returns not found within the selected venue; inability to enter the venue or exercise a capability returns forbidden. Every lookup and reference check includes venue identity, including rooms, template application, leads, receipts, and correction resolutions.

## Application interfaces and boundaries

Types below denote Effect values as `Effect<A, E>` for readability. Actor and venue authority are supplied by server-resolved context, never trusted from a request body.

```ts
interface EventPlans {
  create(input: CreateEvent): Effect<EventDraft, WriteError>;
  getDraft(eventId: EventId): Effect<EventDraft, ReadError>;
  saveDraft(input: SaveDraft): Effect<EventDraft, WriteError>;
  publish(input: PublishDraft): Effect<PublishedRevision, PublishError>;
  cancel(input: CancelEvent): Effect<PublishedRevision, PublishError>;
  getRevision(input: RevisionReference): Effect<PublishedRevision, ReadError>;
  listRevisions(eventId: EventId): Effect<ReadonlyArray<RevisionSummary>, ReadError>;
  list(input: EventDateRange): Effect<ReadonlyArray<EventSummary>, ReadError>;
}

interface Handoffs {
  confirmDirect(input: ConfirmDirect): Effect<ReceiptConfirmation, WriteError>;
  recordVerbal(input: RecordVerbal): Effect<ReceiptConfirmation, WriteError>;
}

interface Corrections {
  request(input: RequestCorrection): Effect<CorrectionRequest, WriteError>;
  list(eventId: EventId): Effect<ReadonlyArray<CorrectionRequest>, ReadError>;
  resolve(input: ResolveCorrection): Effect<CorrectionRequest, WriteError>;
}

interface MenuTemplates {
  list(): Effect<ReadonlyArray<MenuTemplateSummary>, ReadError>;
  get(id: MenuTemplateId): Effect<MenuTemplate, ReadError>;
  save(input: SaveMenuTemplate): Effect<MenuTemplate, WriteError>;
  apply(input: ApplyMenuTemplate): Effect<EventDraft, WriteError>;
}
```

Command inputs are explicit serializable DTOs:

| Input               | Required data                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateEvent`       | Command ID; initial incomplete draft header and plan content                                                                           |
| `SaveDraft`         | Command ID; event ID; expected draft version; complete replacement draft payload                                                       |
| `PublishDraft`      | Command ID; event ID; expected draft version; expected latest revision or explicit no-publication marker                               |
| `CancelEvent`       | Command ID; event ID; expected latest published revision                                                                               |
| `RevisionReference` | Event ID and revision ID                                                                                                               |
| `EventDateRange`    | Inclusive start/end local dates; optional room filter                                                                                  |
| `ConfirmDirect`     | Command ID; revision reference; department; actor is inferred                                                                          |
| `RecordVerbal`      | Command ID; revision reference; department; designated lead ID                                                                         |
| `RequestCorrection` | Command ID; revision reference; nonempty description                                                                                   |
| `ResolveCorrection` | Command ID; request ID; expected request version; explicit outcome                                                                     |
| `SaveMenuTemplate`  | Command ID; create marker or template ID and expected version; name and reusable dish/serving-note definitions                         |
| `ApplyMenuTemplate` | Command ID; event ID; expected draft version; selected activity ID; template ID and expected template version; `Add` or `Replace` mode |

Return draft/template/request versions after successful writes. Template application allocates new dish IDs; template identity may be recorded for provenance but creates no live link. A stale selected template returns conflict so marketing can review the changed template before applying it.

Expected failures are tagged errors with explicit safe fields and transport mappings:

| Error family                                                                                    | HTTP status | Caller behavior                                                   |
| ----------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| Unauthorized                                                                                    | 401         | Return to authentication                                          |
| Forbidden                                                                                       | 403         | Explain missing venue access or capability                        |
| Event/revision/template/request not found                                                       | 404         | Show unavailable resource without leaking another venue's records |
| Draft/template/request version conflict; publication conflict; command reuse                    | 409         | Preserve local input; fetch current state for review              |
| Invalid plan input; missing publication prerequisites; wrong receipt target; illegal transition | 422         | Show actionable fields or transition explanation                  |
| Storage unavailable                                                                             | 503         | Retain input and command ID for safe retry                        |

Unexpected defects remain defects and reach the existing runtime error boundary. Do not convert every storage failure into permission denied or invalid input. Infrastructure causes remain internal.

## Persistence design

Use these conceptual tables, with exact naming aligned during implementation:

| Record                   | Ownership and constraints                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Venues                   | Name and parsed IANA timezone                                                                                               |
| Staff directory          | Venue-owned staff identity; optional login association through membership                                                   |
| Memberships/capabilities | Auth subject → venue staff; no arbitrary client-provided actor                                                              |
| Rooms                    | Venue-owned physical event space                                                                                            |
| Events                   | Stable event ID; venue; draft/published/cancelled state; latest revision reference and number                               |
| Event drafts             | One draft per event; schema version; content document; optimistic version                                                   |
| Event revisions          | Append-only snapshot; publication metadata; changes; expected source versions; command ID and canonical request fingerprint |
| Receipt confirmations    | Revision, department, designated lead, source/recording actor, time; uniqueness prevents duplicate receipt effects          |
| Correction requests      | Reporter, source revision, description, state/outcome, optimistic version                                                   |
| Menu templates           | Venue-owned name and structured reusable content; optimistic version                                                        |
| Command results          | Scoped command ID, operation, canonical fingerprint, result reference for other mutations                                   |

Use composite venue-scoped references and constraints where applicable, unique `(event, revision number)`, one draft per event, and checked nonnegative versions/counts. SQL JSON validity is not domain parsing: decode persisted documents and their supported schema versions before use. Mirror applicable invariants in constraints. Keep schema versions explicit so a future reader never guesses a stored document's meaning.

Historical snapshots keep copied names and content even when directory records change. Store references needed for authorization and attribution alongside their snapshots; do not cascade-delete published history.

### Atomic publication

Own publication persistence in `backend/event-plan/` behind a narrow `commitPublication` operation. The recommended SQL strategy is a guarded revision insertion with a database trigger advancing the event head in that same atomic statement. Use a forward migration for the trigger and test it through D1; do not rely on an application-level sequence of unrelated writes.

The guarded insertion checks the event venue, current membership/capability, legal state, expected draft version, expected latest revision, and same-venue required references. The adapter reads and parses the candidate draft, prepares the snapshot and change summary, and uses the expected versions to ensure that the prepared draft is still the one being published. Assign the next revision number from the current event head inside SQL.

The insertion's trigger advances the latest-revision reference and increments the draft version. That invalidates outstanding saves/publications based on the pre-publication draft while retaining the content for subsequent editing. Snapshot insertion and head advancement either both succeed or neither does. A guarded insertion returning no row is not success.

Before reporting a conflict, look for an already accepted result with this command ID. An identical canonical request returns the existing revision; different input with the same ID returns command-reuse conflict. A uniqueness race follows the same lookup, not an unbounded retry. Revision inserts and accepted command identity belong to the same atomic operation.

Cancellation follows the same guarded insertion/head-transition mechanism, using the latest published content rather than the draft. The trigger records the cancelled state and invalidates outstanding draft writes. Stale draft saves and other publications must check event state as well as version. A cancellation replay returns its original revision; a different attempt after cancellation cannot create another cancellation revision.

For other multi-record mutations, use the D1 client's atomic batch with a guarded write and command-result recording. Gate dependent statements on acceptance of the command; a compare-and-swap affecting zero rows must not permit later statements to create unrelated effects. Prove rollback and replay behavior against local D1. Do not use `Database.transaction` or hold a transaction across HTTP calls.

Milestone 2 is gated on these runtime proofs. This is an implementation verification gate, not a reason to weaken the publication contract if an initial SQL approach fails.

## HTTP contracts and data flow

Keep portable domain schemas and pure operations together in `shared/`; the browser imports these rather than backend runtime modules. HTTP handlers decode inputs, obtain server authority, invoke an application operation, and project its result. Domain-owned D1 adapters own SQL, row decoding, atomicity, and safe storage-error classification. Avoid global `operations-client.ts` or `operations-storage.ts` catch-alls: keep HTTP clients with their frontend feature and persistence with its backend domain.

Extend the existing API under `/api/venues/:venueId`:

| Method/path suffix                                            | Operation                                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /context`                                                | Current venue identity, permissions, room/staff choices required by the editor                     |
| `GET /events`                                                 | Date/room board, using published information for ordinary staff and draft visibility for marketing |
| `POST /events`                                                | Create draft-only event                                                                            |
| `GET /events/:eventId/draft`                                  | Read marketing draft                                                                               |
| `PUT /events/:eventId/draft`                                  | Save with expected version                                                                         |
| `POST /events/:eventId/publications`                          | Publish expected draft                                                                             |
| `GET /events/:eventId/revisions`                              | Publication history                                                                                |
| `GET /events/:eventId/revisions/:revisionId`                  | Fixed revision snapshot with separate current-head/receipt metadata                                |
| `POST /events/:eventId/cancellation`                          | Publish cancellation                                                                               |
| `POST /events/:eventId/revisions/:revisionId/receipts/direct` | Designated lead confirms directly                                                                  |
| `POST /events/:eventId/revisions/:revisionId/receipts/verbal` | Marketing records designated lead's verbal confirmation                                            |
| `GET/POST /events/:eventId/corrections`                       | Read or submit correction requests                                                                 |
| `POST /events/:eventId/corrections/:requestId/resolution`     | Resolve with a published correction or explanation                                                 |
| `GET/POST /menu-templates`                                    | List/create reusable templates                                                                     |
| `GET/PUT /menu-templates/:templateId`                         | Read/update with expected version                                                                  |
| `POST /events/:eventId/draft/menu-template`                   | Apply a reviewed template version to a selected activity                                           |

Retain `/api/me` and public liveness behavior. Add an authenticated venue-membership lookup to choose the configured pilot venue; do not hardcode a browser-supplied venue as authorization. Route the board by event starting date; show later activity dates within the plan and overnight indicators where useful. Do not infer event duration from unknown times.

Use schema-checked request/response DTOs at every process hop. Add explicit same-origin/admission protection for operational mutations; verify the policy instead of assuming Better Auth's route-specific CSRF handling automatically protects new handlers. IDs, recording actor, publication time, and revision numbers are server-owned where authoritative.

### Create, save, publish, and print

```text
Form input
  → Foldkit Message
  → pure update retains form state and returns Command
  → feature-owned HTTP client serializes the request DTO
  → HTTP schema parser
  → authentication → venue authority/capability
  → EventPlans operation → domain parsing/transition
  → domain-owned persistence adapter performs guarded write
  → explicit response projection/schema
  → completion Message → pure update
```

Publishing first verifies prerequisites, then atomically stores a revision and advances the head. Printing a published plan uses its revision-specific route and fixed snapshot; no printable field is resolved from the current draft/template/directory. The first revision has an initial-publication summary; later revisions show readable differences from the immediately preceding published revision, including header and lead changes.

Marketing's draft preview uses the draft and its version, prominently labeled `DRAFT — NOT PUBLISHED`. It has no published number, no receipt controls, and no exposure through ordinary staff routes.

The app's Print action checks the current published head before initiating printing. If it has changed, offer the latest revision or clearly labeled historical printing; do not silently print an old revision as current. If verification fails, say that freshness could not be checked. Native browser printing can print an already displayed page, so revision identity and draft/historical labels must be present in the print layout itself; do not claim that the app can recall or invalidate paper.

### Receipts, corrections, and cancellation

```text
Lead confirmation or marketing's verbal-receipt form
  → parsed revision/department input → venue authority
  → verify designated lead from that revision
  → guarded receipt persistence with authenticated recording actor
  → response → revision-specific handoff status

Staff correction request
  → parsed description + viewed revision → membership check
  → persist open request → visible to marketing and venue staff
  → marketing publishes correction or records no-change explanation
  → explicit version-checked resolution → requester sees outcome

Marketing cancellation
  → expected latest revision → authority/legal-transition check
  → cancellation publication from last published snapshot
  → cancelled head + fresh outstanding handoff indicators
  → direct notification outside app → revision-specific receipt recording
```

Record confirmations against their requested revision even if a newer one exists. A late confirmation of revision 1 cannot satisfy revision 2. If the same person leads both departments, the two departmental receipt obligations remain explicit. Do not infer receipt from page views or assume a saved verbal record means the app contacted anyone.

### Template workflow

```text
Kitchen saves a versioned template
  → marketing selects an activity and reviews template
  → Add or explicit Replace command
  → verify template version, draft version, activity and venue
  → copy reusable dishes with fresh event-local IDs
  → atomically persist new draft version
  → editor shows copied, independently editable content
```

### Failure, retry, and cancellation

Commands carry stable IDs retained for retries after uncertain outcomes. Do not generate a fresh ID merely because the network timed out. A later intentional action gets a new ID. No background retry may publish a different draft than the user requested.

On a stale save, retain both the local input and the server version for review. Do not replace the local form with a background fetch. Use request identity/version matching to ignore older responses that arrive after navigation or newer requests. Template and correction version conflicts use the same explicit review principle.

Commands propagate interruption to fetch where supported and are owned by the Foldkit runtime. Cancelling a network request does not prove the database operation was undone; resolve uncertainty through command-ID replay. There are no detached notification workers or external delivery promises in this release.

### Observability

Use named `Effect.fn` operations and the existing HTTP/runtime reporting. Record stable operation labels, opaque correlation IDs, venue/event/revision IDs where appropriate, versions, outcome, and error tags. Retain original infrastructure causes internally. Never serialize arbitrary plans, requests, dietary needs, special requests, cookies, or credentials into logs, traces, or DevTools-only messages. Operational plans are intentional UI data; telemetry must still minimize their content.

## Frontend design

Use the shared Foldkit examples for routing, asynchronous data, submodels, and owned subscriptions. Extend the app into routed submodels for the event board, editor, published plan/history, and menu templates. Keep authentication behavior intact while making venue resolution an explicit post-authentication state. Staff without venue access get an honest access state rather than an empty operational board.

The event board is hotel-wide, grouped/filterable by starting date and room. Ordinary staff see published event information and published unresolved-detail indicators. Marketing can additionally see draft-only events and clearly separate draft changes from the current published version. Never mix unpublished headcount/room/time changes into the staff reference.

Refresh on page entry, tab return, and explicit Refresh; show last-checked time. Use scoped Foldkit subscriptions for tab visibility/focus events. Coalesce duplicate refreshes and do not let a failed background refresh clear usable prior published data or pretend it is freshly verified. A dirty editor receives a newer-version notice rather than an automatic form replacement. No periodic live stream is required.

Use explicit pending/success/failure/conflict states for writes. Disable duplicate submission while pending, but preserve command IDs and unsaved fields on failure. Keep forms usable with a keyboard and label unknown/none choices clearly. Keep structural actions such as Add, Replace, Publish, and Cancel explicit.

The shared print document contains event/venue/room identity, date and activity dates, revision/publication identity, cancellation or draft status, attendance, running order, dishes and serving instructions, cake, dietary needs, supplied items, requests, unresolved details, and revision changes. Print controls/navigation are excluded. Give long sections readable page breaks and maintain visible revision identity across printed pages where browser print support permits. Do not require background colors or color alone to convey missing information or cancellation. No PDF-generation service is needed initially; browser print/save-to-PDF is sufficient.

## Files and module ownership

These paths are the planned ownership map; directories with placeholders do not imply implemented functionality. Keep cohesive modules together rather than splitting every operation into a file.

| Add                            | Responsibility                                                         |
| ------------------------------ | ---------------------------------------------------------------------- |
| `shared/venue-access/`         | Operational IDs, refined values and staff/room references              |
| `shared/event-plan/`           | Event Plan and Published Revision values and pure domain operations    |
| `shared/menu-template/`        | Reusable content schemas and pure copy/application rules               |
| `shared/handoff/`              | Receipt and correction values and pure domain operations               |
| `backend/venue-access/`        | Auth identity → membership/capabilities; application authority context |
| `backend/event-plan/`          | Draft, publication persistence, cancellation and event queries         |
| `backend/handoff/`             | Receipt and correction workflows                                       |
| `backend/menu-template/`       | Template writes, reads and application workflow                        |
| `backend/<domain>/`            | Domain-specific HTTP and persistence adapters                          |
| `scripts/setup-pilot.ts`       | Idempotent trusted pilot provisioning                                  |
| `frontend/src/<feature>/`      | Feature-owned HTTP adapters with schema decoding and typed failures    |
| `frontend/src/app/route.ts`    | URL/route parsing and rendering                                        |
| `frontend/src/event-board/`    | Board Model/Message/update/view/Commands                               |
| `frontend/src/event-editor/`   | Draft editor, conflict review, draft print preview                     |
| `frontend/src/published-plan/` | Published reference/history, shared print view, handoffs/corrections   |
| `frontend/src/menu-templates/` | Kitchen template editor and selection UI                               |

Change:

- Add an application schema and committed migrations for operational tables, constraints, and publication-trigger SQL. Keep their ownership separate from Better Auth's managed schema; do not edit applied history.
- `backend/api.ts`, `backend/http.ts`, `backend/worker.ts`: compose feature contract groups, handlers, authority/admission and request-scoped layers. Do not let server runtime dependencies leak into shared/browser schemas.
- `frontend/src/app/` and `frontend/src/entry.ts`: evolve application orchestration, routed child messages, client resources and scoped refresh subscriptions. Keep authentication behavior in `frontend/src/identity/` and operational features as siblings, connected with child messages and OutMessages. Preserve `Message` schema integration for DevTools.
- `frontend/src/styles.css`: shared screen/print rules, using the good-css skill when implementation reaches styles.
- `tsconfig.json`: include `shared/**/*.ts` and `scripts/**/*.ts` so new ownership areas receive strict checks.
- `vite.config.ts`: pilot setup task and local integration task wiring if needed; retain Bun package management, Vitest execution, lint/format and Effect-aware typecheck policies.
- `README.md`: implementation status and local pilot/test instructions when capabilities actually land; correct stale version prose when touching it.

Remove the three placeholder operational-area cards once the event board replaces the signed-in shell. Retain the current Better Auth integration; no further auth replacement or compatibility layer is planned.

## RGR TDD plan and implementation sequence

The user agreed these test seams:

1. Public domain operations: publication prerequisites and legal transitions, immutable revision snapshots and changes, template copying, and revision-specific receipt meaning. These do not establish persistence behavior.
2. HTTP API backed by local D1: permissions, persisted behavior, concurrency, atomic publication, retries, receipt attribution. These do not establish browser layout.
3. Foldkit transitions and rendered documents: editor state, conflict recovery, correct revision selection and print content. These do not establish physical pagination or operational usefulness.

Use Vitest and existing runtime patterns. Group tests under `test/unit/<domain>/` and `test/integration/<domain>/`. Name Foldkit Scene interaction suites `scene.test.ts`, direct transition suites `update.test.ts`, and Story pipeline suites `story.test.ts`; keep command and adapter execution suites separate. Work one behavior at a time: failing test, minimal implementation, repeat. Avoid module mocks, private helper assertions, and a horizontal phase of all tests before implementation. Control audit time and generated identifiers through Effect/runtime seams; do not use sleeps to force races. Exercise real D1 for D1 claims and the production migration path for migration claims.

### Milestone 1 — Hotel access and pilot setup

Deliver venue/room/staff/membership persistence, trusted pilot setup, venue-context endpoints, and an access-aware signed-in screen.

Vertical slices:

1. An authenticated identity without a membership cannot read operational context; wire the access state through the UI.
2. A provisioned staff member sees the configured hotel and room choices; repeating provisioning creates no duplicates.
3. A staff member cannot select another hotel's room, staff, event, template, or revision; prove cross-venue denial with two test venues even though rollout has one.
4. Marketing and kitchen capabilities grant the intended writes independently; ordinary staff retain read/correction access.
5. A directory lead without a login can be selected without granting that person any implicit auth membership.

Migration evidence: add application migration tests for fresh and existing databases, preserving Better Auth records/schema and applicable operational constraints. Add `test/integration/venue-access/http.test.ts` against the local Worker/D1. Extend `test/unit/identity/update.test.ts`, `test/unit/identity/scene.test.ts`, and `test/unit/app/update.test.ts` only for changed post-authentication behavior.

### Milestone 2 — Thin publication and printing path

Deliver a minimal event draft, publication, revision retrieval/history and the common print route before building the complete editor.

Vertical slices:

1. Save an incomplete draft, then reject publication with missing required header fields and return actionable errors.
2. Supply required fields; publish revision 1 with explicit unknown operational details and render/print it as published.
3. Change the draft or directory names; revision 1 still returns the same snapshot.
4. Replay the same publication command; return revision 1. Reuse its ID for different input; reject it.
5. Race two distinct publications of the same expected draft; exactly one succeeds, with one new head and no orphan revision. Race identical commands; they resolve to the same accepted result.
6. Force the publication SQL's head-update path to fail in a disposable local D1 fixture; demonstrate that no snapshot/head partial commit survives. Do not infer atomicity from an in-memory adapter.
7. Edit the draft after the candidate is read but before commit; the stale candidate cannot publish. A stale save after publication also fails without overwriting the newly versioned draft.
8. Print a newer revision and retrieve the old one separately; neither route reads a mutable draft.

Tests: `test/unit/event-plan/domain.test.ts`, `test/integration/event-plan/http.test.ts`, `test/integration/event-plan/publication-concurrency.test.ts`, and `test/unit/published-plan/scene.test.ts`. Use public HTTP results and revision/history reads for assertions. Adapter failure injection may live at the D1 seam in a disposable test fixture, never as production bypass endpoints.

Exit gate: atomicity, concurrency, migration and replay evidence on local D1. Do not expand the application around an unproven publication implementation.

### Milestone 3 — Complete event-plan editor

Deliver activities, timings/dates, headcounts, dishes and the required operational sections, plus honest unresolved-detail indicators.

Vertical slices:

1. Unknown, none, and provided operational details round-trip and render distinctly; empty provided values are rejected.
2. Event attendance flows to activities unless explicitly overridden; zero and unknown retain different meanings.
3. An activity after midnight uses the later date; approximate/unknown timing survives editing and printing without guessed ordering.
4. Publish with unresolved allowed details; list the gaps on screen and paper.
5. Preview/print a draft with the unpublished label and no revision/receipt affordances; ordinary staff cannot fetch it.
6. Two editors save different changes; the stale one retains unsaved input and can review the fetched version. Background refresh and out-of-order responses cannot erase that input.

Tests: expand domain/API tests; add `test/unit/event-editor/update.test.ts` and `test/unit/event-editor/scene.test.ts`, and extend `test/unit/published-plan/scene.test.ts` print coverage. Test through the editor submodel's public transitions and rendered output, not private form helpers.

### Milestone 4 — Changes and handoffs

Deliver readable differences, departmental receipt status, correction requests, and terminal cancellation.

Vertical slices:

1. Publishing revision 2 shows changed instructions and starts new outstanding receipt obligations while preserving revision 1's receipts.
2. The designated logged-in lead confirms directly; another staff member cannot impersonate them.
3. Marketing records verbal receipt for a non-login lead with accurate actor/source attribution. Duplicate attempts do not create duplicate effects.
4. A late revision-1 confirmation does not satisfy revision 2; a changed lead cannot rewrite the old revision's assignment.
5. A staff correction stays open after unrelated publication, then resolves with an explicit corrected revision or a required no-change explanation visible to the requester. Reject references to another event/venue or conflicting concurrent resolution.
6. Cancellation publishes from the last published snapshot, creates fresh receipt obligations and prominent labels, and preserves history. Draft edits/template application/publication after cancellation fail; receipts still work.

Tests: `test/integration/handoff/receipts.test.ts`, `test/integration/handoff/corrections.test.ts`, cancellation slices in `test/integration/event-plan/http.test.ts`, plus `test/unit/handoff/domain.test.ts` and `test/unit/published-plan/scene.test.ts`. Do not test actual external delivery: the pilot has no automated sender.

### Milestone 5 — Reusable menu templates

Deliver kitchen template editing and marketing's reviewed Add/Replace application into a chosen activity.

Vertical slices:

1. Kitchen saves/updates a template; unauthorized staff cannot maintain templates.
2. Marketing adds a reviewed template to an activity with fresh copied IDs and preserved existing dishes.
3. Explicit Replace affects only the selected activity; retrying does not duplicate the copied dishes.
4. Editing the template leaves its existing event copy and published snapshots unchanged.
5. A stale template or draft version prevents application and preserves the editor's local work; cross-venue references fail.

Tests: `test/unit/menu-template/domain.test.ts`, `test/integration/menu-template/http.test.ts`, `test/unit/menu-templates/scene.test.ts`, and `test/unit/event-editor/update.test.ts` for observable template application transitions.

### Milestone 6 — Event board, freshness, and service rehearsal

Deliver the final date/room board, current-reference refresh behavior, readable printing and pilot instructions.

Vertical slices:

1. Staff see published data and its gaps/receipt status; marketing can additionally find draft-only events without leaking draft changes into staff views.
2. Page entry, tab return and manual refresh check current state; duplicate triggers coalesce. Old responses cannot overwrite newer route/data state.
3. A failed refresh retains the last loaded reference but clearly reports that it was not freshly verified.
4. Print checks detect a newer revision; historical/draft/cancelled labels survive print rendering. No receipt from an old revision is presented as current.

Tests: `test/unit/event-board/update.test.ts`, `test/unit/event-board/scene.test.ts`, `test/unit/app/update.test.ts` for root route/refresh transitions, `test/integration/event-plan/http.test.ts` for board projections, and `test/unit/published-plan/scene.test.ts` for rendered print content. Use browser/runtime inspection during implementation when requested/authorized, following project DevTools runtime selection rules.

Manually inspect a short plan and a long multi-page plan in browser print/save-to-PDF: revision identity, readable sections, unknown values, overnight activities, cancellation, grayscale and page breaks. Rehearse an event from incomplete draft through template application, publication, printing, both receipt paths, a staff correction, republishing, fresh confirmations and cancellation. Include simultaneous events in different rooms. Ask whether a waiter and kitchen lead can find their instructions quickly; passing automated tests alone does not prove this.

## Verification and handoff

For each milestone, run focused tests while implementing, then `vp run check`, `vp run test`, and relevant local `vp run test:integration` coverage with the local Worker configured. Do not report skipped integration tests as passing D1 evidence. Add a build check when changing browser imports, shared contracts, routing or print assets. Keep verification local; deployment requires its own explicit request.

Before pilot use, preserve existing auth behavior, verify same-origin mutation admission and venue isolation, prove publication semantics on actual D1, inspect printed output, and complete the service rehearsal. Document any failed gate rather than replacing it with an unsupported claim.

Implementation starts with milestones 1 and 2. Detailed editor and template work follows the publication proof; reusable templates and the completed event board are required before calling the first release ready.
