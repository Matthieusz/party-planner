import { Clock, Context, Effect, Layer } from "effect";

import { canReadSession } from "./authorization";
import { currentStatus } from "./domain";
import type {
  FunctionId,
  GetSessionInput,
  Session,
  StaffContext,
} from "./domain";
import { Forbidden } from "./forbidden";
import type { NotFound } from "./not-found";
import type { PersistenceError } from "./persistence-error";
import { SessionRepository } from "./repository";

/** Application operations for venue-scoped operational Session reads. */
export interface SessionServiceInterface {
  readonly get: (
    input: GetSessionInput
  ) => Effect.Effect<Session, NotFound | Forbidden | PersistenceError>;
  readonly list: (
    staff: StaffContext
  ) => Effect.Effect<readonly Session[], PersistenceError>;
}

/** Application service for operational Session reads. */
export class SessionService extends Context.Service<
  SessionService,
  SessionServiceInterface
>()("@party-planner/api/SessionService") {}

const withCurrentStatus = (session: Session, now: number): Session => ({
  ...session,
  status: currentStatus(session, now),
});

/** Live Session application layer, parameterized by its repository port. */
export const sessionServiceLayer = Layer.effect(
  SessionService,
  Effect.gen(function* sessionServiceLayer() {
    const repository = yield* SessionRepository;

    const isAuthorized = Effect.fn("Session.authorizeRead")(
      function* isAuthorized(staff: StaffContext, id: FunctionId) {
        if (staff.role !== "coordinator") {
          return true;
        }
        return yield* repository.isAssigned(staff.venueId, staff.id, id);
      }
    );

    const get = Effect.fn("Session.get")(function* get(input: GetSessionInput) {
      const session = yield* repository.findById(input.staff.venueId, input.id);
      const authorized = yield* isAuthorized(input.staff, session.id);
      if (!authorized) {
        return yield* new Forbidden({
          id: session.id,
          staffId: input.staff.id,
          venueId: input.staff.venueId,
        });
      }
      const now = yield* Clock.currentTimeMillis;
      return withCurrentStatus(session, now);
    });

    const list = Effect.fn("Session.list")(function* list(staff: StaffContext) {
      const sessions = yield* repository.listByVenue(staff.venueId);
      const now = yield* Clock.currentTimeMillis;
      const visibleSessions: Session[] = [];

      for (const session of sessions) {
        const isAssigned =
          staff.role === "coordinator"
            ? yield* repository.isAssigned(staff.venueId, staff.id, session.id)
            : false;
        if (canReadSession(staff, isAssigned)) {
          visibleSessions.push(withCurrentStatus(session, now));
        }
      }
      return visibleSessions;
    });

    return SessionService.of({ get, list });
  })
);
