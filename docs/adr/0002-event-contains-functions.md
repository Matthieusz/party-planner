# 0002 — Event contains many Functions

The product's central object is the **Event** (user-facing term) backed by a `booking` row in the data model. An Event contains one or more **Function** rows — each Function is a single meal or session with its own start/end time, menu, guest list, seating, and staff assignment. A wedding weekend is one Event with N Functions (ceremony, cocktail hour, reception, after-party, brunch); a single corporate dinner is one Event with one Function.

**Why parent-child, not flat:** the wedding-weekend case is common enough that designing it out would force a painful migration later. The cost of building the hierarchy from day one is one extra table and one extra navigation level; the cost of retrofitting is a rewrite of every event-scoped query.

**Consequences**

- `booking` is the parent table; `function` has a non-null `bookingId` foreign key. Both carry `venueId` (denormalized for row-level scoping — see ADR 0001).
- Menu, guest list, seating, and staff assignment attach to the **Function**, not the Event. Cross-function aggregation (e.g., total guests across a wedding weekend) is a query, not a stored field.
- In product copy, say "Event" for the Booking and "Function" (or the chosen UI term) for the child. The data-model names `booking` and `function` stay as-is to match the industry's "Banquet Event Order" vocabulary.
- A Function without an Event (a one-off walk-in lunch) is not supported in the data model — it would require a single-Function Booking, which is fine.
