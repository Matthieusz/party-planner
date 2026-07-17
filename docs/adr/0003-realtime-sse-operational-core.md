# 0003 — Real-time via SSE on the operational core

The MVP is online only. Live updates are scoped to the four collections the staff stares at during a shift — `function`, `menu`, `function_assignment`, `booking` — and delivered via Server-Sent Events (SSE). The Server pushes change events; the client invalidates the relevant Effect reactivity keys. Everything else is refresh-based.

**Why SSE, not WebSockets or polling**

SSE is one-way push, no WebSocket server, no bidirectional plumbing, and works on every hosting target (Node, edge, serverless with a long-lived response). The MVP's real-time needs are pure invalidation ("this changed, refetch"), which is exactly SSE's sweet spot. WebSockets add infrastructure for capabilities (presence, live cursors, chat) we don't have a v1 use for. Polling works but burns bandwidth and adds noticeable staleness.

**Consequences**

- Postgres `LISTEN/NOTIFY` emits change events for the four collections; the API layer forwards them over an SSE endpoint keyed by `venueId` (so Staff only see changes for their Venue).
- The client subscribes through one active-Venue connection; each event invalidates the narrowest matching Effect reactivity key. No client-side merge logic.
- Writes still go through normal Effect `HttpApi` endpoints; SSE is a side-channel, not a write path. No optimistic-locking or conflict-resolution complexity in MVP.
- A future move to WebSockets (when we need presence or live cursors) is a server-side swap that doesn't change the client invalidation contract.
