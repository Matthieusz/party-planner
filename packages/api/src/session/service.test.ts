import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";

import { canReadSession } from "./authorization";
import { currentStatus, FunctionId, StaffId, VenueId } from "./domain";
import type { Session, StaffRole } from "./domain";
import { Forbidden } from "./forbidden";
import { NotFound } from "./not-found";
import { SessionRepository } from "./repository";
import { sessionServiceLayer, SessionService } from "./service";

const venueA = VenueId.make("venue-a");
const venueB = VenueId.make("venue-b");
const coordinatorId = StaffId.make("staff-coordinator");
const adminId = StaffId.make("staff-admin");
const sessionAId = FunctionId.make("session-a");
const sessionBId = FunctionId.make("session-b");

const sessionA: Session = {
  endsAt: 200,
  id: sessionAId,
  name: "Breakfast",
  startsAt: 100,
  status: "scheduled",
  venueId: venueA,
};
const sessionB: Session = {
  endsAt: 200,
  id: sessionBId,
  name: "Dinner",
  startsAt: 100,
  status: "scheduled",
  venueId: venueB,
};
const sessions: readonly Session[] = [sessionA, sessionB];

const repositoryLayer = Layer.succeed(SessionRepository, {
  findById: (venueId, id) => {
    const session = sessions.find(
      (candidate) => candidate.venueId === venueId && candidate.id === id
    );
    return session
      ? Effect.succeed(session)
      : Effect.fail(new NotFound({ id, venueId }));
  },
  isAssigned: (venueId, staffId, id) =>
    Effect.succeed(
      venueId === venueA && staffId === coordinatorId && id === sessionAId
    ),
  listByVenue: (venueId) =>
    Effect.succeed(sessions.filter((session) => session.venueId === venueId)),
});

const testLayer = sessionServiceLayer.pipe(Layer.provide(repositoryLayer));
const unassignedTestLayer = sessionServiceLayer.pipe(
  Layer.provide(
    Layer.succeed(SessionRepository, {
      findById: () => Effect.succeed(sessionA),
      isAssigned: () => Effect.succeed(false),
      listByVenue: () => Effect.succeed([]),
    })
  )
);

const staff = (role: StaffRole) => ({
  id: role === "admin" ? adminId : coordinatorId,
  role,
  venueId: venueA,
});

describe("Session domain", () => {
  it("rejects empty identifiers at the boundary", () => {
    expect(Schema.decodeUnknownResult(VenueId)("")._tag).toBe("Failure");
  });

  it("derives time-driven status while preserving explicit terminal states", () => {
    expect(currentStatus(sessionA, 99)).toBe("scheduled");
    expect(currentStatus(sessionA, 100)).toBe("active");
    expect(currentStatus(sessionA, 200)).toBe("completed");
    expect(currentStatus({ ...sessionA, status: "cancelled" }, 150)).toBe(
      "cancelled"
    );
    expect(currentStatus({ ...sessionA, status: "completed" }, 50)).toBe(
      "completed"
    );
  });

  it("applies role and assignment authorization", () => {
    expect(canReadSession(staff("admin"), false)).toBe(true);
    expect(canReadSession(staff("kitchen"), false)).toBe(true);
    expect(canReadSession(staff("service"), false)).toBe(true);
    expect(canReadSession(staff("coordinator"), false)).toBe(false);
    expect(canReadSession(staff("coordinator"), true)).toBe(true);
  });
});

describe("SessionService", () => {
  it.effect(
    "lists only venue-scoped Sessions and computes current status",
    () =>
      Effect.gen(function* testSessionService() {
        const service = yield* SessionService;
        const result = yield* service.list(staff("admin"));

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe(sessionAId);
        expect(result[0]?.status).toBe("scheduled");
      }).pipe(Effect.provide(testLayer))
  );

  it.effect("limits Coordinators to assigned Sessions", () =>
    Effect.gen(function* testSessionService() {
      const service = yield* SessionService;
      const result = yield* service.list(staff("coordinator"));

      expect(result.map(({ id }) => id)).toEqual([sessionAId]);
    }).pipe(Effect.provide(testLayer))
  );

  it.effect("rejects an unassigned Coordinator", () =>
    Effect.gen(function* testSessionService() {
      const service = yield* SessionService;
      const error = yield* service
        .get({ id: sessionAId, staff: staff("coordinator") })
        .pipe(Effect.flip);

      expect(error).toBeInstanceOf(Forbidden);
    }).pipe(Effect.provide(unassignedTestLayer))
  );

  it.effect("does not reveal a Session from another Venue", () =>
    Effect.gen(function* testSessionService() {
      const service = yield* SessionService;
      const error = yield* service
        .get({ id: sessionBId, staff: staff("admin") })
        .pipe(Effect.flip);

      expect(error).toBeInstanceOf(NotFound);
    }).pipe(Effect.provide(testLayer))
  );
});
