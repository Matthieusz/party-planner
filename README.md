# party-planner

Party Planner is a venue-scoped operations application built with Effect, React, and TanStack Start.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Effect HttpApi** - Schema-derived HTTP contracts, handlers, and OpenAPI
- **Effect Atoms** - Request-scoped frontend server state and live invalidation
- **Node.js** - Runtime environment
- **Drizzle v1 RC** - Effect-native PostgreSQL persistence
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
pnpm run db:push
```

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@party-planner/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Format and lint fix: `pnpm run check`

## Project Structure

```
party-planner/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
│   └── server/      # Effect Node HTTP runtime
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # HttpApi contracts, handlers, and application services
│   ├── auth/        # Better Auth adapter and identity services
│   ├── db/          # Drizzle schemas, repositories, and migrations
│   └── env/         # Effect server config and browser-public config
```

## Effect architecture

The backend runs on the Effect Node HTTP server. `HttpApi` contracts call venue-scoped application services and repositories, with Better Auth isolated behind an Effect adapter. The browser uses a request-scoped Effect Atom registry for server state and invalidates stable reactivity keys from venue-authorized SSE events. PostgreSQL `LISTEN/NOTIFY` supplies live operational-core changes.

See [`docs/migrations/effect-v4-atoms.md`](docs/migrations/effect-v4-atoms.md) for the completed migration record and [`docs/adr/0003-realtime-sse-operational-core.md`](docs/adr/0003-realtime-sse-operational-core.md) for live-update semantics.

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:generate`: Generate database client/types
- `pnpm run db:migrate`: Run database migrations
- `pnpm run db:studio`: Open database studio UI
- `pnpm run check`: Run Oxlint and Oxfmt
