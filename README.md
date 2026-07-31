<div align="center">

# Party Planner

**Calm, venue-scoped operations for the people keeping events on track.**

Party Planner brings bookings, sessions, menus, rooms, headcounts, and service updates into one shared workspace for hotels and event venues. Less spreadsheet archaeology, more knowing what needs attention.

<p>
  <a href="https://github.com/Matthieusz/party-planner">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/stars/Matthieusz/party-planner.svg?variant=outline&amp;mode=dark">
      <img alt="GitHub stars" src="https://shieldcn.dev/github/stars/Matthieusz/party-planner.svg?variant=outline&amp;mode=light">
    </picture>
  </a>
  <a href="https://github.com/Matthieusz/party-planner/blob/main/LICENSE">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/license/Matthieusz/party-planner.svg?variant=outline&amp;mode=dark">
      <img alt="MIT license" src="https://shieldcn.dev/github/license/Matthieusz/party-planner.svg?variant=outline&amp;mode=light">
    </picture>
  </a>
  <a href="https://github.com/Matthieusz/party-planner/commits/main/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/commits/Matthieusz/party-planner.svg?variant=outline&amp;mode=dark">
      <img alt="GitHub commits" src="https://shieldcn.dev/github/commits/Matthieusz/party-planner.svg?variant=outline&amp;mode=light">
    </picture>
  </a>
</p>

</div>

## The short version

A wedding, conference, or banquet can involve a lot of moving parts. Party Planner gives venue teams one operational view of the work:

- **Coordinators** manage Events, Sessions, menus, headcounts, rooms, and assignments.
- **Kitchen staff** get the prep information they need and fire courses during service.
- **Service staff** see live Sessions and keep floor timing up to date.
- **Admins** manage the Venue, Staff, Clients, and access.

The MVP is intentionally focused: online-only, venue-scoped, and built around an in-app **needs attention** view instead of a wall of decorative metrics.

## What is here now

- Venue-scoped multi-tenancy with four roles: Admin, Coordinator, Kitchen, and Service
- Event-to-Session planning, with status transitions and assignment-based access
- Menus, courses, menu items, and reusable Menu Templates
- Rooms and expected guest headcounts
- Better Auth for identity and venue membership
- Live updates for the operational core through venue-authorized Server-Sent Events
- In-app notifications through the needs-attention view

Named guests, seating charts, offline support, email notifications, and push notifications are deliberately later milestones. The kitchen has enough to do without us pretending the MVP needs everything on day one.

## Built with

| Area                | Tools                                                           |
| ------------------- | --------------------------------------------------------------- |
| Frontend            | React, TanStack Start, TanStack Router, Tailwind CSS, shadcn/ui |
| State and contracts | Effect v4, Effect Atoms, Effect HttpApi                         |
| Backend             | Effect Node HTTP server, Node.js                                |
| Identity            | Better Auth                                                     |
| Persistence         | PostgreSQL, Drizzle v1 RC                                       |
| Workspace           | pnpm, Turborepo, TypeScript                                     |
| Quality             | Oxlint, Oxfmt, Ultracite, Vitest                                |

## How the pieces fit

```text
React + TanStack Start
├── Effect Atoms
│   └── request-scoped server state and live invalidation
└── Effect HttpApi
    ├── venue-scoped application services
    ├── Better Auth adapter
    └── Drizzle → PostgreSQL

PostgreSQL LISTEN/NOTIFY
└── venue-authorized SSE → stable frontend invalidation keys
```

The important boundary is the Venue. Application services, authorization, realtime events, and persisted business data all respect it. A Coordinator's access to a Session comes from assignment, while Kitchen and Service operate venue-wide within their role scope.

## Getting started

### Prerequisites

- Node.js
- pnpm 11
- PostgreSQL, either locally or through Docker

### Run it locally

```bash
git clone git@github.com:Matthieusz/party-planner.git
cd party-planner
pnpm install
```

If you are using the local Docker database, start it with:

```bash
pnpm db:start
```

If you already have PostgreSQL, skip that command and use its connection details. Set the server configuration in `apps/server/.env`, then apply the schema and start the workspace:

```bash
pnpm db:push
pnpm dev
```

Once everything is running:

- Web app: [localhost:3001](http://localhost:3001)
- API: [localhost:3000](http://localhost:3000)

## Useful commands

| Command            | What it does                      |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start the web app and server      |
| `pnpm dev:web`     | Start only the web app            |
| `pnpm dev:server`  | Start only the server             |
| `pnpm check`       | Run linting and formatting checks |
| `pnpm check-types` | Check types across the workspace  |
| `pnpm test`        | Run the test suite                |
| `pnpm db:studio`   | Open Drizzle Studio               |
| `pnpm db:generate` | Generate a database migration     |
| `pnpm db:migrate`  | Run database migrations           |

## Project map

```text
party-planner/
├── apps/
│   ├── web/         # React + TanStack Start frontend
│   └── server/      # Effect Node HTTP runtime
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # HttpApi contracts, handlers, and services
│   ├── auth/        # Better Auth adapter and identity services
│   ├── db/          # Drizzle schemas, repositories, and migrations
│   └── env/         # Server and browser-public configuration
├── docs/            # ADRs and migration notes
├── CONTEXT.md       # Domain language and business rules
└── DESIGN.md        # Product design system
```

## A few technical notes

- [Effect v4 and Atoms migration](docs/migrations/effect-v4-atoms.md)
- [Realtime SSE decision record](docs/adr/0003-realtime-sse-operational-core.md)
- [Domain context and terminology](CONTEXT.md)
- [Product goals and design constraints](PRODUCT.md)

## UI customization

Shared shadcn/ui primitives live in `packages/ui`:

- Design tokens and global styles: `packages/ui/src/styles/globals.css`
- Shared primitives: `packages/ui/src/components/`
- Shared component configuration: `packages/ui/components.json`

Add a shared primitive from the project root with:

```bash
pnpm dlx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Use it in an app with:

```tsx
import { Button } from "@party-planner/ui/components/button";
```

## License

[MIT](LICENSE). Built in public, with a healthy respect for the difference between a useful dashboard and a very expensive spreadsheet.
