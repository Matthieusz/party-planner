# 0005 — Session status is lazy on read

The Session `status` field is treated as a _hint_, not a source of truth, for the three time-driven states (`scheduled` / `active` / `completed`). The application exposes a single `currentStatus(session, now)` helper that derives the effective status from `status + starts_at + ends_at + now()`. The `status` column is only ever written for the two user-controlled transitions: `→ cancelled` (the Session will not run) and `→ completed` (set early by a user). Every read path goes through `currentStatus` so the displayed status is always correct relative to the current time.

**Why lazy, not a cron**

A Venue has tens of Sessions per week, not thousands. The home view and the calendar view both need a correct effective status; both are reads. A background job adds an always-on process, a clock-skew risk, and a category of "the job didn't run" bugs. Lazy computation is correct for every case, runs only when data is read, and the function is testable in isolation.

**Consequences**

- The SSE emitter compares the previous and current effective status when a Session changes and pushes a "status changed" event when they differ. The four live-push collections (ADR-0003) include `function`, so updates still flow.
- A future analytics job that needs the _persisted_ status computes it the same way; the same `currentStatus` function is the contract.
- A move to a cron-based write is a single migration that flips `status` writes from "user-controlled only" to "always write" and adds a scheduler. No API change. No contract change for clients.
