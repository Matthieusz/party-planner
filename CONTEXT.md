# Party Planner

A multi-tenant operational hub for hotels and venues to coordinate events, service, and kitchen prep from a single source of truth.

## Language

**Venue**:
A hotel, banquet hall, or other event space that operates the product. The unit of tenancy — every business row belongs to exactly one Venue. In the data model the tenant lives in the `organization` table managed by Better-Auth's `organization` plugin, extended with a Venue-only `timezone` column. Domain code calls it a "venue"; the auth/API layer says "organization."
_Avoid_: "tenant" in user-facing copy; "account"; "organization" in product copy (use "venue").

**Staff**:
A person employed by a Venue who uses the product (event coordinator, banquet manager, F&B director, service staff). Implemented as the Better-Auth `member` row, with the `role` column holding one of our four custom roles.
_Avoid_: "user" in domain logic; "member" in product copy (the term "member" is fine inside the auth layer); "employee" in product copy.

**User**:
An identity that can authenticate. The auth concept, not a domain role. A Staff member has a User account; in the future a Client may also have a User account.
_Avoid_: using "user" to mean a domain role — always say Staff or Client instead.

**Client**:
The person or organization that hires a Venue to host an event. A first-class domain entity owned by a Venue — reusable across events, with its own contact history and aggregated preferences. Has no login in the MVP; the coordinator reaches them by phone, email, or whatever external channel the venue uses.
_Avoid_: "customer" (conflicts with SaaS Customer); "guest" (those are attendees, not the hirer); "contact".

**Event** (domain: **Booking**):
The user-facing term for what a Client books with a Venue — a multi-function affair such as a wedding, corporate dinner, or conference. One Event contains one or more Functions. In the data model this is a `booking` row; the UI calls it an "Event" for plain-language readability.
_Avoid_: "event" in the data model (use `booking`); "party" in domain code (the product is named Party Planner, but the domain term is Event).

**Function** (UI term: **Session**):
A single meal or session within an Event — the unit of work that has its own start/end time, menu, guest list, seating chart, and staff assignment. In the data model a `function` row; the UI calls it a "Session" for plain-language readability. Multiple Sessions belong to one Event.
_Avoid_: using "Event" or "Booking" to mean a single Function — that confuses the hierarchy.

**SaaS Customer**:
The Venue considered as the buyer of the product. Today there is no billing; this is a data-model term reserved for the future, not a user-facing concept.

## Relationships

- A **Venue** has many **Staff**
- A **Venue** has many **Client** records
- A **Venue** has many **Event**s (bookings)
- A **Client** belongs to one **Venue**; a **Client** can be the hirer of many Events over time
- An **Event** belongs to one **Venue** and one **Client**; an **Event** has many **Function**s
- A **Staff** is one **User** with venue-scoped access

## Staff roles

Four roles, each with a hard-coded permission set in code (not a `permissions` table).

- **Admin** — full access; can invite Staff, edit Venue settings, manage Clients and Events.
- **Coordinator** — creates and manages Events, Sessions, menus, guests, seating, and Staff assignments for the Sessions they own.
- **Kitchen** — sees prep lists and BEO items; designs menus; fires courses during service.
- **Service** — sees live Sessions; marks courses served; updates service timing on the floor.

A Staff has **exactly one role**. The role is a permission bundle, not a job title — in smaller venues one person wears many hats, but their assigned role is the maximal bundle they need (typically Admin). If a recurring overlap appears (e.g., kitchen + service), the fix is to add a fifth role, not to make roles composable.

**Authority anchors**

- A **Coordinator's** authority over a Session is rooted in **assignment** (a `function_assignment` row), not in Booking creation. When a Coordinator creates a Booking, the system assigns them to its Functions automatically — otherwise they'd be locked out of their own work. "The Coordinator who owns this Session" always means "is currently assigned to it." Same anchor for Bookings: a Coordinator can edit a Booking iff they're assigned to at least one of its Functions.
- **Kitchen** and **Service** roles have **venue-wide** authority within their scope — Kitchen can fire courses on any Session in the venue; Service can mark courses served on any Session in the venue. They are not restricted by assignment. (The Kitchen is a centralized service; Service staff move across the floor.)
- **Clients** are venue-wide, not per-Coordinator. Any Coordinator (or Admin) can read and edit any Client in the Venue. Clients are a venue-level CRM, not a per-Coordinator silo.
- **Menu Templates** are authored by Admin and Coordinator; Kitchen consumes them (views and applies them to a Session). Service does not interact with templates.

## Lifecycle (status state machines)

**Event (Booking)** — three states, terminal-state progression:

- `confirmed` — created, ready to plan
- `completed` — every Session is `completed` (set automatically or by an Admin)
- `cancelled` — the Event will not run; this is a deliberate, recorded no-go

Pre-booking stages (`inquiry`, `tentative`) are explicitly out of scope for the MVP — that pipeline lives in email and phone calls.

**Session (Function)** — four states, time-driven transitions:

- `scheduled` — booked, in the future
- `active` — auto-set at start time; can be flipped early or late by Staff
- `completed` — auto-set at end time + grace period; can be flipped by Staff
- `cancelled` — the Session will not run

A `needs attention` view derives signals from status + time + missing data (e.g., "Session starts in 30 minutes, menu is empty"), not from a hand-managed flag.

## Headcount (deferred named guests)

For the MVP, the system tracks a **headcount** — an integer count of expected guests — and not individual guest records. Named guests, dietary needs, accessibility, RSVP status, and visual seating are deferred to a later milestone ("visual seating"), at which point a `guest` table is added and the headcount becomes a derived or cached count of that table.

**Headcount scope:** an integer on the Event (`event.expected_guest_count`) and an optional per-Session override (`function.expected_guest_count`, nullable, falls back to the Event). Matches the wedding pattern (100 invited, 30 at the after-party, 60 at the brunch).

The MVP tracks **expected** only. Actual / checked-in counts are added with the visual seating milestone.

The headcount still matters operationally: the kitchen needs a cover count, the service staff need to know how many tables to set, the coordinator watches capacity vs room limits.

## Menu

A **Menu** belongs to a Session and describes what is served. A Menu has **Courses** (e.g., appetizer, main, dessert), and each Course has **Menu Items** (e.g., Garden Salad, Tomato Bisque). Courses carry a position for ordering; Items carry a position within their Course, plus optional description, prep notes, and an allergens list (free-form for MVP; structured allergen reporting can be added with the visual seating milestone).

**Menu Templates** are reusable Menu definitions owned by a Venue. Applying a template to a Session **deep-copies** the template's courses and items into a new per-Session Menu. Edits to the per-Session Menu never affect the template; edits to the template never affect existing Sessions that already used it. Lineage is recorded for analytics (`menu.derived_from_template_id`), not for re-sync.

## Room

A **Room** is a named physical space within a Venue where a Session happens — "Grand Ballroom," "Garden Terrace," "Atrium," "Pool Deck." A Venue has many Rooms; the Admin manages the list. A Session has a non-null `roomId` so the operational view can group and filter by room.

For the MVP, a Room is just a name owned by a Venue. Capacity, setup styles, and AV equipment are deferred.

## Real-time and notifications

The MVP is **online only**. Offline (read or full) is a later milestone.

Real-time updates are scoped to the operational core via **Server-Sent Events (SSE)**:

- `function` (status, time, room, headcount, notes)
- `menu` (and its courses/items)
- `function_assignment`
- `booking` (status, dates)

Everything else (Rooms, Menu Templates, Clients, historical data, admin views) is refresh-based. WebSockets and oRPC subscriptions are deferred.

Notifications are **in-app only** for the MVP. The "needs attention" view inside the app is the single source of truth. Email digests and push notifications are later milestones.

## Example dialogue

> **Dev:** "Should the registration form say 'Create a venue' or 'Create an account'?"
> **Domain expert:** "Say 'Create a venue' — a Venue is what the customer is creating. The auth identity underneath is incidental."

## Flagged ambiguities

- PRODUCT.md's "Users" heading refers to venue Staff in the domain sense, but `user` is also the auth table name. Resolution: in product copy and domain code, use Staff. The `user` table stays for auth only; it carries venue membership through a `staff` row, not through a `venueId` column.
- "Customer" is overloaded — it can mean the SaaS customer (the Venue) or the person hiring the Venue to host an event. Resolution: "SaaS Customer" = Venue; the party-thrower is called a **Client** (pending Q2).
