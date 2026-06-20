# 0001 — Multi-tenant SaaS, venue-as-tenant, no billing in MVP

The product is multi-tenant from day one. Each Venue (hotel or event space) is a tenant with isolated data; every business row carries a `venueId`. Authentication and the data model are built for many tenants, but billing, plans, and payments are explicitly deferred — the MVP is a single Venue in local development, and the schema is shaped so a billing layer can be added later without restructuring tenancy.

**Tenancy is implemented through Better-Auth's `organization` plugin.** The plugin's `organization` table is the tenant, extended with a Venue-only `timezone` column. Membership, invitations, active-organization, and role/permission plumbing all come from the plugin. Domain code refers to the tenant as a "venue"; the auth layer says "organization." The `member` table holds Staff with one of our four custom roles.

**Consequences**

- Every domain table gets `venueId` (non-null, foreign key) and a composite index on `(venueId, ...)` for the common access pattern.
- All read paths must scope by `venueId`; the auth layer resolves the active venue from the session's `activeOrganizationId` and exposes it to oRPC procedures.
- No `plan`, `subscription`, `invoice`, or `payment` tables yet. No Stripe or payment-provider integration. The Venue is created without a billing account.
- The "create venue" flow is open and free for the MVP; gating on plan/limits is deferred.
- A future chain/group hierarchy (one tenant owning multiple Venues) is compatible: a `parentVenueId` or a separate `group` table can be added without breaking the `venueId` contract.
- Adding fields to the plugin-managed `organization` table is done by extending our Drizzle schema; the plugin reads what we define.
