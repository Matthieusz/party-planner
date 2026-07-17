import { Database } from "@party-planner/db";
import {
  functionAssignment,
  functionTable,
} from "@party-planner/db/schema/operational";
import { and, eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";

import { Session } from "./domain";
import type { FunctionId, StaffId, VenueId } from "./domain";
import { NotFound } from "./not-found";
import { PersistenceError } from "./persistence-error";
import { SessionRepository } from "./repository";

const persistenceError = (operation: string) =>
  Effect.mapError(
    (cause: unknown) => new PersistenceError({ cause, operation })
  );

const decodeRows = (operation: string, rows: readonly unknown[]) =>
  Schema.decodeUnknownEffect(Schema.Array(Session))(rows).pipe(
    persistenceError(`${operation}.decode`)
  );

/** Drizzle Effect implementation of venue-scoped Session persistence. */
export const sessionRepositoryLive = Layer.effect(
  SessionRepository,
  Effect.gen(function* makeSessionRepository() {
    const database = yield* Database;

    const listByVenue = Effect.fn("SessionRepository.listByVenue")(
      function* listByVenue(venueId: VenueId) {
        const rows = yield* database
          .select({
            endsAt: functionTable.endsAt,
            id: functionTable.id,
            name: functionTable.name,
            startsAt: functionTable.startsAt,
            status: functionTable.status,
            venueId: functionTable.venueId,
          })
          .from(functionTable)
          .where(eq(functionTable.venueId, venueId))
          .pipe(
            Effect.map((results) =>
              results.map((row) => ({
                ...row,
                endsAt: row.endsAt.getTime(),
                startsAt: row.startsAt.getTime(),
              }))
            ),
            persistenceError("SessionRepository.listByVenue")
          );
        return yield* decodeRows("SessionRepository.listByVenue", rows);
      },
      (effect, venueId) =>
        effect.pipe(
          Effect.annotateLogs({ venueId }),
          Effect.withSpan("SessionRepository.listByVenue")
        )
    );

    const findById = Effect.fn("SessionRepository.findById")(
      function* findById(venueId: VenueId, id: FunctionId) {
        const sessions = yield* listByVenue(venueId);
        const session = sessions.find((candidate) => candidate.id === id);
        if (!session) {
          return yield* new NotFound({ id, venueId });
        }
        return session;
      },
      (effect, venueId, id) =>
        effect.pipe(
          Effect.annotateLogs({ functionId: id, venueId }),
          Effect.withSpan("SessionRepository.findById")
        )
    );

    const isAssigned = Effect.fn("SessionRepository.isAssigned")(
      function* isAssigned(venueId: VenueId, staffId: StaffId, id: FunctionId) {
        const rows = yield* database
          .select({ functionId: functionAssignment.functionId })
          .from(functionAssignment)
          .where(
            and(
              eq(functionAssignment.venueId, venueId),
              eq(functionAssignment.staffId, staffId),
              eq(functionAssignment.functionId, id)
            )
          )
          .limit(1)
          .pipe(persistenceError("SessionRepository.isAssigned"));
        return rows.length === 1;
      },
      (effect, venueId, staffId, id) =>
        effect.pipe(
          Effect.annotateLogs({ functionId: id, staffId, venueId }),
          Effect.withSpan("SessionRepository.isAssigned")
        )
    );

    return SessionRepository.of({ findById, isAssigned, listByVenue });
  })
);
