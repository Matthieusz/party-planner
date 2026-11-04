# Venue Operations

Foundation for the application described in [the product plan](./PRODUCT.md),
with terminology defined in [the glossary](./GLOSSARY.md):
**Foldkit + Effect HTTP API + Better Auth + Alchemy + Cloudflare D1**.

The repository directory/package is still `party-planner`; the application uses
Venue Operations terminology.

## Run locally

```sh
bun install --frozen-lockfile
vp run dev
```

Open **http://localhost:1337**. Vite proxies `/api/*` to the local Worker on
port 1339. Alchemy runs the Worker and D1 locally, provisions a stable signing
secret, and applies Better Auth's managed schema migrations. No manually supplied
signing secret or cloud deployment is needed. Local state lives under the ignored
`.alchemy/` directory; preserve it to retain resource identities and signing secrets.

Create an identity to enter the Live Operations shell with Marketing, Kitchen,
and Service. The UI verifies identity through protected `/api/me`; no localStorage
profile is authoritative. Better Auth owns the HttpOnly session cookie. Passwords
remain redacted in Foldkit model/messages and are unwrapped only for authentication.
Foldkit DevTools and MCP dispatch remain development-only.

### Frontend hot reload

`vp run dev` starts both servers. Alternatively, run `vp run dev:server` and
`vp run dev:web` separately. The Worker at 1339 serves the compiled frontend;
rebuild with `vp run build:web` after frontend changes when using that URL.

The default configuration trusts only `http://localhost:1339` and
`http://localhost:1337`. Production requires `AUTH_ORIGIN` to equal the public
HTTPS origin, without a path or trailing slash; the Vite origin is not trusted
in production. The browser client uses the current page's origin.

## Project tooling

Use the pinned Bun version in `package.json`. Tasks are defined in the root
`vite.config.ts`; without a global Vite+ installation, use `bunx --no-install vp`.

```sh
vp run check         # lint, formatting, Effect-aware strict typecheck
vp run test          # Vitest unit tests, no infrastructure needed
vp run build         # typecheck and production frontend build
```

Vite+ owns development, Vitest execution, linting, formatting, and frontend builds.
Bun remains the package manager, not the test runner. Keep the `vite` dependency
and override aligned with Vite+, and pin `vitest` and its override to the bundled
version reported by `vp toolchain vitest`. Effect execution tests use the pinned
`@effect/vitest` integration: `it.effect` supplies a per-test Scope and test
services, `it.layer` supplies layer fixtures, and `it.effect.prop` runs effectful
properties. Use `it.live` only when real runtime services are needed. Scene and
pure update tests remain ordinary Vitest tests. Vendored anti-slop rules live
under `tools/oxlint/anti-slop/`; consult its `UPSTREAM.md` before changing them.

## UI components (Foldcn)

[Foldcn](https://foldcn.elianiva.com/) is configured in `components.json` with
Tailwind CSS v4 and the `@foldcn` registry. Components live under
`frontend/src/components/ui`; `@/` resolves to `frontend/src`.

```sh
bunx shadcn@latest add @foldcn/button @foldcn/dialog
```

These are Foldkit components, not React components. Check dependency versions
before installing registry items so they do not downgrade the pinned Effect or
Foldkit versions. The base light/dark theme is in `frontend/src/foldcn.css`;
`frontend/src/styles.css` imports styles and sets base fonts. The root `dark`
class selects the dark theme. Component docs are available at
`https://foldcn.elianiva.com/docs/<name>.md`.

## Naming conventions

- Use kebab-case for files and folders, PascalCase for schemas and services,
  and camelCase for functions and Layer exports (with a `Layer` suffix).
- Name Foldkit Commands as imperatives (such as `CheckIdentity` and `SignOut`)
  and Messages as facts (such as `UpdatedEmail` and `SubmittedAuthForm`).
- Name tests for their seam within domain folders: `scene.test.ts` for Foldkit
  Scene interactions, `update.test.ts` for direct transitions, and `story.test.ts`
  only for Story pipelines. Keep command and adapter execution tests separate.
- Name request context for what it proves: `CurrentIdentity` establishes an
  authenticated identity, not membership or authorization.

## Architecture

```text
Browser: Foldkit + Better Auth client
   │ same-origin /api/* requests + HttpOnly session cookie
   ▼
Cloudflare Worker
   ├── Foldkit static assets
   ├── /api/auth/*     (Alchemy Better Auth → BetterAuthDb)
   └── Effect HttpApi
         ├── GET /api/health (public)
         └── GET /api/me     (Authentication → CurrentIdentity)
```

| Path                                | Responsibility                                                    |
| ----------------------------------- | ----------------------------------------------------------------- |
| `alchemy.run.ts`                    | Infrastructure root and production origin requirement             |
| `backend/worker.ts`                 | Worker composition: Better Auth, D1, application API and assets   |
| `backend/api.ts`, `backend/http.ts` | API group and HTTP layer composition                              |
| `backend/identity/`                 | Auth service, managed store, request identity and HTTP adapter    |
| `backend/health/`                   | Public liveness contract and HTTP adapter                         |
| `shared/identity/`                  | Identity data contract shared by browser and server               |
| `frontend/src/identity/`            | Identity UI, commands and runtime-supplied clients                |
| `frontend/src/entry.ts`             | Foldkit application and resource composition                      |
| `test/unit/`, `test/integration/`   | Tests grouped by capability; cross-cutting tests stay at the root |

Organize new capabilities by domain within each runtime: put shared contracts
in `shared/<domain>/`, server behavior and adapters in `backend/<domain>/`,
frontend behavior in `frontend/src/<feature>/`, and matching tests in
`test/unit/<domain>/` or `test/integration/<domain>/`. Keep domain rules independent
of HTTP and persistence; the Worker supplies implementations. Placeholder
folders mark planned capabilities, not implemented functionality. Shared UI
components and composition roots remain outside individual capabilities.

The `@alchemy.run/better-auth` integration supplies request-scoped database access,
a managed signing secret, and automatic schema migrations through `CloudflareD1`.
Auth tables are not application-owned Drizzle tables; there is no separate
Drizzle migration history or `db:generate` task. Future operational persistence
must have its own explicit schema/migration ownership rather than modifying
Better Auth's internal tables.

### Fresh authentication store

This replacement intentionally does **not** import Yielded users, passwords,
sessions, or cookies. Users must register again. The new resource ID is
`BetterAuthDb`; the old auth implementation, schema migrations, custom crypto,
password screening, and durable token buckets have been removed from source.
No compatibility layer or database wipe command is included. Cloud deployment
may propose removal of the old managed resource; inspect the plan and approve
any destructive changes before deploying. Existing local/cloud data has not
been deleted by the source change.

## Local integration verification

With the local stack running:

```sh
AUTH_TEST_URL=http://localhost:1339 vp run test:integration
```

The test accepts only loopback hostnames and never deploys infrastructure. It
creates disposable identities in local D1, verifies registration/session cookies,
protected access, session lookup, sign-out/revocation, wrong-password rejection,
duplicate registration safety, rejection of an untrusted origin, and the Vite
development origin. Without `AUTH_TEST_URL`, it is skipped.

## Scope and security

Email/password auth uses Better Auth's default hashing, session, and rate-limit
policies. The former custom password screening, D1-backed token buckets, and
30-minute idle timeout are intentionally not preserved. Default in-memory rate
limits are not a durable cross-isolate budget. Do not assume the old security
properties still apply.

- Registration signs the user in; sign-out revokes the server session.
- Protected responses expose only `id`, `name`, and `email`, not session tokens.
- Missing sessions return 401; typed lookup failures return 503. Unexpected
  defects remain server errors rather than being disguised as missing credentials.
- Authentication is not Venue Membership or Venue authorization.
- Operational Areas remain an empty shell, not seeded operational data.
- Sign-up is open. Email verification, password recovery, invitations, and
  membership/venue authorization are not configured. Add these before serving
  real restaurant teams.

### Future operational authorization

`CurrentIdentity` establishes identity only. When operational features are
implemented, resolve Venue Membership and Venue-specific permissions as
server-side application capabilities, and require the appropriate capability
for every operational read and write. Do not treat a session, a browser-supplied
Venue, or hidden UI controls as authorization. Wire implementations at the
Worker and test missing membership, insufficient permissions, and cross-Venue
access through the protected operations. These capabilities do not exist yet;
see the [implementation plan](./docs/implementation-plan.md) for the planned
access model and verification.

## Cloud deployment (explicit opt-in)

**Local development does not deploy.** Deployment requires a configured
[Cloudflare profile](https://alchemy.run/cloudflare/setup) or the credentials in
`.env.example`, and can incur charges:

```sh
AUTH_ORIGIN=https://your-public-origin.example vp run deploy
```

This targets the `production` stage and provisions the Worker, D1, managed
signing secret, and Better Auth schema. Do not deploy until the account,
resource replacement plan, and application access policies are ready.

Alchemy uses local deployment state (`Alchemy.localState()`). Keep `.alchemy/`
private and preserve it; a fresh checkout cannot automatically manage existing
resources. Shared/remote state is not configured.

## Dependency baseline and references

Dependency versions are specified in `package.json` and resolved in `bun.lock`.
Keep Alchemy integration releases aligned and rerun the real local auth test
when upgrading.

- [Alchemy Better Auth tutorial](https://alchemy.run/better-auth/tutorial/part-1)
- [D1 integration](https://alchemy.run/better-auth/databases/cloudflare-d1)
- [HTTP API middleware](https://alchemy.run/better-auth/guides/http-api-middleware)
- [Better Auth](https://www.better-auth.com/)

CodeGraph is initialized and ignored by Git. After source changes:

```sh
codegraph sync .
```
