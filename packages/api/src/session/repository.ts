import { Context } from "effect";
import type { Effect } from "effect";

import type { FunctionId, Session, StaffId, VenueId } from "./domain";
import type { NotFound } from "./not-found";

/** Venue-scoped persistence operations needed by Session reads. */
export interface SessionRepositoryService {
  readonly findById: (
    venueId: VenueId,
    id: FunctionId
  ) => Effect.Effect<Session, NotFound>;
  readonly isAssigned: (
    venueId: VenueId,
    staffId: StaffId,
    id: FunctionId
  ) => Effect.Effect<boolean>;
  readonly listByVenue: (venueId: VenueId) => Effect.Effect<readonly Session[]>;
}

/** Persistence port for venue-scoped Session reads. */
export class SessionRepository extends Context.Service<
  SessionRepository,
  SessionRepositoryService
>()("@party-planner/api/SessionRepository") {}
