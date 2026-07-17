import { PartyPlannerClient } from "./api-client";

/** Shared key used by Session reads and future writes/SSE invalidation. */
export const activeVenueSessionsKey = ["active-venue", "sessions"] as const;

/**
 * The authenticated Venue's operational Sessions. The idle TTL is also the SSR
 * freshness window: hydrated data remains authoritative for 30 seconds.
 */
export const sessionsAtom = PartyPlannerClient.query("sessions", "list", {
  reactivityKeys: activeVenueSessionsKey,
  serializationKey: "active-venue",
  timeToLive: "30 seconds",
});
