# Venue Operations

Foundation for the application described in [`CONTEXT.md`](./CONTEXT.md):
**Foldkit + Effect HTTP API + Yielded Auth + Drizzle ORM + Alchemy + Cloudflare D1**.

The repository directory/package is still `party-planner`; the application uses
Venue Operations terminology. `CONTEXT.md` is unchanged.

## Run locally

```sh
bun install --frozen-lockfile
bun dev
```

Open **http://localhost:1339**. Alchemy runs the Worker and D1 locally and applies
the committed D1 migrations. Auth uses opaque server-side sessions, so local
development needs no manually configured signing secret or cloud provisioning.
Local database/state files live under the ignored `.alchemy/`.

Create an identity, sign in, and see the Live Operations shell with Management,
Kitchen, and Service. The UI confirms the identity through protected `/api/me`,
not through a localStorage profile. Session cookies are owned by Yielded;
the client stores no tokens. Passwords are redacted in the model/messages.
Foldkit DevTools and MCP message dispatch are enabled for local development;
their bridge is development-only.

### Frontend hot reload

Start the local Worker and Vite together:

```sh
bun run dev:all
```

Open **http://localhost:1337**. Bun runs the existing `dev` and `dev:web`
scripts in parallel; Vite proxies `/api/*` to the local Worker while preserving
the frontend origin. Alternatively, run `bun dev` and `bun run dev:web` in
separate terminals. The Worker at 1339 serves the compiled frontend; restart
`bun dev` (or run `bun run build:web`) after frontend edits if you use that URL
instead of Vite.

The Worker uses a fixed policy for each local origin: `http://localhost:1339`
and, through Vite, `http://localhost:1337`. The browser client uses the current
origin. Production requires `AUTH_ORIGIN` to be the public HTTPS origin; the
local Vite policy is enabled only with the default local configuration.

## UI components (Foldcn)

[Foldcn](https://foldcn.elianiva.com/) is configured for this Foldkit frontend,
with Tailwind CSS v4 and the `@foldcn` registry in `components.json`. Its base
light/dark theme lives in `frontend/src/foldcn.css`. The authentication and
Live Operations views use Foldcn Button, Input, Card, Alert, and Spinner
components, with Tailwind utilities for page layout. `frontend/src/styles.css`
contains the stylesheet imports and base font settings. Add the `dark` class to the root
HTML element to select the dark theme.

Install components from the repository root as needed:

```sh
bunx shadcn@latest add @foldcn/button @foldcn/dialog
```

Components go into `frontend/src/components/ui`, shared helpers into
`frontend/src/lib`, and `@/` resolves to `frontend/src` in both TypeScript and
Vite. `tsx: true` in `components.json` selects TypeScript output; these are
Foldkit components, not React components.

The base theme was copied from the official registry, and its `utils` and
`icons` helpers were installed through the CLI. Core dependencies retain this
project's pinned Effect 4.0.0 and Foldkit 0.165.0, with matching
`@foldkit/ui` 0.165.0. The upstream base item currently requests Effect
4.0.0-rc.116; do not reinstall `@foldcn/foldcn` without checking its dependency
versions, since that would downgrade this project's Effect baseline.

Component documentation is available as Markdown at
`https://foldcn.elianiva.com/docs/<name>.md`.

## Architecture

```text
Browser: Foldkit
   │ same-origin /api/* requests + HttpOnly session cookie
   ▼
Cloudflare Worker
   ├── Foldkit static assets
   └── Effect HttpApi
         ├── /api/auth/*     (Yielded HTTP handlers → YieldedAuthDb)
         ├── GET /api/health (public)
         └── GET /api/me     (Authentication → CurrentTeamMember)
```

| Path                                                  | Responsibility                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `alchemy.run.ts`                                      | Infrastructure composition root and production origin requirement |
| `backend/worker.ts`                                   | Worker entry, request-scoped D1, static assets                    |
| `backend/auth-contract.ts`                            | Shared Yielded actions and registration schemas                   |
| `backend/auth.ts`                                     | Password strategy and session policy                              |
| `backend/auth-live.ts`                                | Cryptography, screening, and persistence composition              |
| `backend/auth-storage.ts`                             | Explicit Yielded D1 adapter mappings and identity claims          |
| `backend/database.ts`                                 | Shared request-scoped Drizzle service and stable D1 resource      |
| `backend/schema.ts`, `backend/auth-tables.ts`         | Application and Yielded Drizzle tables                            |
| `drizzle.config.ts`, `backend/migrations/`            | Drizzle Kit generation and Alchemy-applied D1 migrations          |
| `backend/password-screening.ts`, `backend/passwords/` | Offline password blocklist and provenance                         |
| `backend/password-limits.ts`                          | Atomic D1 token buckets for password attempts                     |
| `backend/api.ts`, `backend/http.ts`                   | Effect HTTP contract and Yielded HTTP integration                 |
| `backend/middleware.ts`                               | Session resolution and protected identity injection               |
| `frontend/src/auth-client.ts`                         | Runtime-owned Yielded browser client                              |
| `frontend/src/main.ts`, `frontend/src/commands.ts`    | Foldkit authentication state and commands                         |
| `test/unit/`, `test/integ/`                           | UI, auth boundaries, screening, and real local D1 lifecycle       |

One Worker serves both the frontend and API in deployment. No cross-site cookies,
credentialed CORS allowlist, or second publicly deployed frontend Worker is needed.
Alchemy's `Cloudflare.Worker` static assets serve the Foldkit Vite build; this is
not an assets-only `Website.Foldkit` resource, because the same Worker also owns
the Effect API.

## Database and migrations

Application repositories use `Database` from `backend/database.ts`. The Worker
creates one Effect-native Drizzle instance per request; Yielded's D1 adapter,
identity claims, and password limiter use that same instance/client. D1 remains
the only database. The resource ID stays `YieldedAuthDb` to preserve existing
accounts and Alchemy state, even though it now serves application data too.

For example, inside a backend repository:

```ts
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { Database } from "./database.ts";
import { subjects } from "./schema.ts";

const activeIdentities = Effect.gen(function* () {
  const database = yield* Database;
  return yield* database
    .select({ id: subjects.id, name: subjects.name, email: subjects.email })
    .from(subjects)
    .where(eq(subjects.active, 1));
});
```

Keep database queries in backend adapters/repositories, decode persisted data
into domain schemas there, and translate typed query failures at that boundary.
Do not acquire the binding or construct a second Drizzle client in a handler.
D1 does not support interactive SQL transactions: Yielded and the token bucket
limiter use native atomic D1 batches through the shared client instead.

Export application tables from `backend/schema.ts`; it also exposes the owned
Yielded tables and the password rate-limit table. After changing a table:

```sh
bun run db:generate --name=describe_change
bun run format
bun run check
bun test test/unit
```

Review and commit the generated SQL and snapshot together. Generation is local,
needs no Cloudflare credentials, and never applies or pushes schema changes.
Alchemy applies committed migrations during `bun dev` or an explicitly requested
deploy; do not use Drizzle Kit or Wrangler to maintain a second migration ledger.
Restart the local stack after adding a migration if it has not picked it up.

Drizzle Kit writes to `backend/migrations/drizzle/`. This nested layout lets
Alchemy recursively read both the original flat migrations and generated SQL,
without changing the original applied migration IDs. The initial Drizzle
snapshot records the existing schema; its SQL is a no-op because
`0001_yielded_auth.sql` and `0002_password_limits.sql` already create the tables.
Keep those original files and the baseline. Do not move the generated folders
to the migration root or point Alchemy only at the nested directory.

Unlike Yielded's managed Bun SQLite example, the D1 adapter uses explicit
application-owned mappings in `backend/auth-storage.ts`.

## Verification

```sh
bun run check         # lint, formatting, strict typecheck
bun run build         # strict typecheck + frontend production build
bun run test          # unit tests; no infrastructure needed
```

With the local stack running:

```sh
AUTH_TEST_URL=http://localhost:1339 bun run test:integ
```

The integration test never deploys infrastructure and accepts only loopback
hostnames. It creates a disposable identity in the local database and verifies
registration, cookies, session lookup, protected access, sign-out and revocation,
duplicate registration safety, offline password rejection, persistent attempt
limits, CSRF protection, and rejection of an untrusted origin. Without
`AUTH_TEST_URL` it is skipped. Run only against a
local database where disposable test identities are acceptable.

## Scope and security

Auth uses Argon2id password hashing, a shared derivation concurrency limit, and
D1-backed opaque sessions with an eight-hour absolute lifetime and a 30-minute
idle timeout. Sign-out revokes the server session. Password attempt limits are
atomic D1 token buckets shared across requests and isolates. The Worker allows
30 seconds of CPU time for the portable password KDF; cloud performance has not
been measured by the local tests. One derivation runs per isolate; excess work
returns `PasswordUnavailable` immediately rather than waiting across Worker
request contexts. Clients can retry.

New passwords must have at least eight code points and pass the offline
blocklist plus account/service-name screening. The bundled corpus contains
12,527 entries from two pinned SecLists lists; provenance, licensing, refresh
instructions, and its finite coverage are documented in
[`backend/passwords/UPSTREAM.md`](./backend/passwords/UPSTREAM.md). Registration
sends no password or password hash to a screening service.

The migration creates a fresh `YieldedAuthDb` resource. Existing Better Auth
development users, passwords, and cookies are discarded; there is no account
import or compatibility layer.

Application access remains limited to an authenticated foundation:

- Identity verification is not Organization membership or Venue authorization.
- The Operational Areas are an empty shell, not seeded operational data.
- Sign-up is open; email verification, invitations, password recovery, and
  membership/venue access policies are not configured. Implement those policies
  before serving real restaurant teams.
- Protected responses expose only `id`, `name`, and `email`; server session tokens
  are not returned by `/api/me`.
- Missing sessions yield 401; typed auth lookup failures yield 503. Unexpected
  defects are not disguised as invalid credentials.

## Cloud deployment (explicit opt-in)

**Local development does not deploy.** Cloud deployment requires a configured
[Cloudflare profile](https://alchemy.run/cloudflare/setup), or the Cloudflare
credentials described in `.env.example`, and can incur charges:

```sh
AUTH_ORIGIN=https://your-public-origin.example bun run deploy
```

This targets the `production` stage, creates the Worker and D1, and applies the
committed auth schema. The configured origin must match the public Worker/custom
domain origin. Do not run it until the target account and the application access
policies are ready.

Alchemy state is local (`Alchemy.localState()`). Keep `.alchemy/` private and
preserve its deployment state: it tracks the managed resources. Do not discard it
after deployment or assume a fresh checkout can manage
existing resources. Remote/shared state is not configured by this setup.

## Dependency baseline and references

Versions are pinned in `package.json` and resolved in `bun.lock`: Effect 4.0.0,
Foldkit 0.165.0, Alchemy 2.0.0-beta.80, Yielded Auth/crypto/persistence
0.1.0-beta.23, and Drizzle ORM/Kit 1.0.0-rc.4. Yielded and Alchemy are beta dependencies;
upgrade deliberately and rerun the real authentication test. Bun applies the
committed official Yielded Effect v4 Drizzle patch through `patchedDependencies`;
keep `patches/drizzle-orm@1.0.0-rc.4.patch` alongside the lockfile.

The pinned Yielded password-management facade requires reset services alongside
registration. This application exposes registration through its supported custom
strategy interface and the native D1 registration authority, while the built-in
password strategy handles sign-in. Recovery remains outside the current scope.

Implementation references:

- [Yielded Auth](https://yielded.dev/auth/)
- [Yielded HTTP and browser client](https://yielded.dev/auth/guide/http-and-client/)
- [Yielded persistence adapters](https://yielded.dev/auth/reference/adapters/)
- [Alchemy's Foldkit example](https://github.com/alchemy-run/alchemy-effect/tree/ea384f00bf5207c41459189843d590b28d64484f/examples/cloudflare-foldkit)
- [NolanGC's full-stack starter](https://github.com/NolanGC/foldkit-alchemy-starter) — architectural reference only; its custom Postgres auth wrapper is not used here.

CodeGraph is initialized and ignored by Git. After source changes:

```sh
codegraph sync .
```
