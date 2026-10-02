# Venue Operations

Foundation for the application described in [`CONTEXT.md`](./CONTEXT.md):
**Foldkit + Effect HTTP API + Alchemy + Cloudflare D1 + first-party Better Auth integration**.

The repository directory/package is still `party-planner`; the application uses
Venue Operations terminology. `CONTEXT.md` is unchanged.

## Run locally

```sh
bun install --frozen-lockfile
bun dev
```

Open **http://localhost:1339**. Alchemy runs the Worker and D1 locally, applies
Better Auth's schema migrations, and generates a signing secret. No Neon,
Postgres, manually configured auth secret, or cloud provisioning is needed for
this local stack. Local database/state files live under the ignored `.alchemy/`.

Create an identity, sign in, and see the Live Operations shell with Management,
Kitchen, and Service. The UI confirms the identity through protected `/api/me`,
not through a localStorage profile. Session cookies are owned by Better Auth;
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

Better Auth uses `http://localhost:1339` as its canonical `baseURL` and trusts
both local origins (`http://localhost:1339` and `http://localhost:1337`). These
are configured in `backend/auth.ts`; replace them with the production origin
before deploying. Frontend API requests remain relative and same-origin.

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
   ├── /api/auth/*  → @alchemy.run/better-auth
   │                     └── CloudflareD1(AuthDb)
   └── Effect HttpApi
         ├── GET /api/health  (public)
         └── GET /api/me     (Authentication → CurrentTeamMember)
```

| Path                             | Responsibility                                                 |
| -------------------------------- | -------------------------------------------------------------- |
| `alchemy.run.ts`                 | Infrastructure composition root, local deployment state        |
| `backend/worker.ts`              | Worker entry, API/auth dispatch, compiled static assets        |
| `backend/auth.ts`                | Narrow auth service backed by the first-party integration      |
| `backend/database.ts`            | D1 resource; auth schema managed by the integration            |
| `backend/api.ts`                 | Schema-checked Effect HTTP contract                            |
| `backend/middleware.ts`          | Session resolution and protected identity injection            |
| `backend/current-team-member.ts` | Safe identity projection, no session secrets                   |
| `frontend/src/main.ts`           | Foldkit authentication state machine and Live Operations shell |
| `frontend/src/commands.ts`       | Runtime-owned auth requests and response parsing               |
| `test/unit/`                     | UI transitions and HTTP authentication boundary tests          |
| `test/integ/`                    | Real local D1/Worker authentication lifecycle                  |

One Worker serves both the frontend and API in deployment. No cross-site cookies,
credentialed CORS allowlist, or second publicly deployed frontend Worker is needed.
Alchemy's `Cloudflare.Worker` static assets serve the Foldkit Vite build; this is
not an assets-only `Website.Foldkit` resource, because the same Worker also owns
the Effect API.

## Verification

```sh
bun run build         # strict typecheck + frontend production build
bun run test          # unit tests; no infrastructure needed
```

With the local stack running:

```sh
AUTH_TEST_URL=http://localhost:1339 bun run test:integ
```

The integration test never deploys infrastructure and accepts only loopback
hostnames. It creates a disposable identity in the local database and verifies
sign-up, cookies, session lookup, protected access, sign-out, sign-in, and rejection
of an untrusted origin. Without `AUTH_TEST_URL` it is skipped. Run only against a
local database where disposable test identities are acceptable.

## Scope and security

This is an authenticated foundation, **not a finished venue-access system**:

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
bun run deploy
```

This targets the `production` stage and creates the Worker and D1, applies the
auth schema, and binds the generated auth signing secret. Do not run it until
the target account and the application access policies are ready.

Alchemy state is local (`Alchemy.localState()`). Keep `.alchemy/` private and
preserve its deployment state: it tracks resources and the generated signing
secret. Do not discard it after deployment or assume a fresh checkout can manage
existing resources. Remote/shared state is not configured by this setup.

## Dependency baseline and references

Versions are pinned in `package.json` and resolved in `bun.lock`: Effect 4.0.0,
Foldkit 0.165.0, Alchemy and `@alchemy.run/better-auth` 2.0.0-beta.80. Alchemy is
still a beta dependency; upgrade it and its integration together and rerun the
real authentication test.

Implementation references:

- [Alchemy's official D1 + Better Auth + Effect HttpApi example](https://github.com/alchemy-run/alchemy-effect/tree/ea384f00bf5207c41459189843d590b28d64484f/examples/cloudflare-better-auth)
- [Alchemy's Foldkit example](https://github.com/alchemy-run/alchemy-effect/tree/ea384f00bf5207c41459189843d590b28d64484f/examples/cloudflare-foldkit)
- [NolanGC's full-stack starter](https://github.com/NolanGC/foldkit-alchemy-starter) — architectural reference only; its custom Postgres auth wrapper is not used here.

CodeGraph is initialized and ignored by Git. After source changes:

```sh
codegraph sync .
```
