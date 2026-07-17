import { NodeHttpServer } from "@effect/platform-node";
import { describe, expect, it } from "@effect/vitest";
import { CurrentIdentity, Unauthenticated } from "@party-planner/auth";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiTest } from "effect/unstable/httpapi";

import { ApiAuthentication, PartyPlannerApi } from "./http-api";
import { sessionsHandlersLayer } from "./http-handlers";
import { FunctionId, StaffId, VenueId } from "./session/domain";
import { NotFound } from "./session/not-found";
import { SessionService } from "./session/service";

const venueId = VenueId.make("venue-a");
const staffId = StaffId.make("staff-a");
const sessionId = FunctionId.make("session-a");

const identity = {
  role: "admin" as const,
  staffId,
  userId: "user-a",
  venueId,
};

const authenticationLayer = Layer.succeed(
  ApiAuthentication,
  ApiAuthentication.of((httpEffect) =>
    httpEffect.pipe(Effect.provideService(CurrentIdentity, identity))
  )
);

const unauthenticatedLayer = Layer.succeed(
  ApiAuthentication,
  ApiAuthentication.of(() => Effect.fail(new Unauthenticated()))
);

const sessionsLayer = Layer.succeed(
  SessionService,
  SessionService.of({
    get: ({ id, staff }) =>
      id === sessionId && staff.venueId === venueId
        ? Effect.succeed({
            endsAt: 200,
            id: sessionId,
            name: "Dinner service",
            startsAt: 100,
            status: "scheduled",
            venueId,
          })
        : Effect.fail(new NotFound({ id, venueId: staff.venueId })),
    list: (staff) =>
      Effect.succeed(
        staff.venueId === venueId
          ? [
              {
                endsAt: 200,
                id: sessionId,
                name: "Dinner service",
                startsAt: 100,
                status: "scheduled" as const,
                venueId,
              },
            ]
          : []
      ),
  })
);

const handlerLayer = sessionsHandlersLayer.pipe(
  HttpRouter.provideRequest(sessionsLayer)
);
const testLayer = Layer.merge(
  handlerLayer,
  NodeHttpServer.layerHttpServices
).pipe(
  Layer.provideMerge(authenticationLayer),
  Layer.provideMerge(sessionsLayer)
);

const unauthenticatedTestLayer = Layer.merge(
  handlerLayer,
  NodeHttpServer.layerHttpServices
).pipe(
  Layer.provideMerge(unauthenticatedLayer),
  Layer.provideMerge(sessionsLayer)
);

describe("Session HttpApi transport", () => {
  it.effect("encodes the authenticated venue-scoped Session list", () =>
    Effect.gen(function* testList() {
      const client = yield* HttpApiTest.groups(PartyPlannerApi, ["sessions"]);
      const sessions = yield* client.sessions.list();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.venueId).toBe(venueId);
    }).pipe(Effect.provide(testLayer))
  );

  it.effect("returns the declared authentication failure", () =>
    Effect.gen(function* testAuthentication() {
      const client = yield* HttpApiTest.groups(PartyPlannerApi, ["sessions"]);
      const result = yield* Effect.result(client.sessions.list());

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        expect(result.failure._tag).toBe("Auth.Unauthenticated");
      }
    }).pipe(Effect.provide(unauthenticatedTestLayer))
  );

  it.effect("maps a missing venue-scoped Session to the declared error", () =>
    Effect.gen(function* testNotFound() {
      const client = yield* HttpApiTest.groups(PartyPlannerApi, ["sessions"]);
      const result = yield* Effect.result(
        client.sessions.get({ params: { id: FunctionId.make("missing") } })
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        expect(result.failure._tag).toBe("Session.NotFound");
      }
    }).pipe(Effect.provide(testLayer))
  );
});
