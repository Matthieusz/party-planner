import {
  AuthService,
  CurrentIdentity,
  Unauthenticated,
} from "@party-planner/auth";
import { Effect, Layer, Schema } from "effect";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { PartyPlannerApi, ApiAuthentication } from "./http-api";
import { StaffContext } from "./session/domain";
import { SessionService } from "./session/service";

const authenticationLayer = Layer.effect(
  ApiAuthentication,
  Effect.gen(function* makeAuthentication() {
    const auth = yield* AuthService;

    return ApiAuthentication.of((httpEffect) =>
      Effect.gen(function* authenticateRequest() {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const identity = yield* auth
          .resolveIdentity(
            new Headers(request.headers as Record<string, string>)
          )
          .pipe(Effect.mapError(() => new Unauthenticated()));
        return yield* httpEffect.pipe(
          Effect.provideService(CurrentIdentity, identity)
        );
      })
    );
  })
);

export const sessionsHandlersLayer = HttpApiBuilder.group(
  PartyPlannerApi,
  "sessions",
  (handlers) =>
    handlers
      .handle("list", () =>
        Effect.gen(function* listSessions() {
          const identity = yield* CurrentIdentity;
          const staff = yield* Schema.decodeUnknownEffect(StaffContext)({
            id: identity.staffId,
            role: identity.role,
            venueId: identity.venueId,
          }).pipe(Effect.orDie);
          const sessions = yield* SessionService;
          return yield* sessions.list(staff);
        })
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* getSession() {
          const identity = yield* CurrentIdentity;
          const staff = yield* Schema.decodeUnknownEffect(StaffContext)({
            id: identity.staffId,
            role: identity.role,
            venueId: identity.venueId,
          }).pipe(Effect.orDie);
          const sessions = yield* SessionService;
          return yield* sessions.get({ id: params.id, staff });
        })
      )
);

export const httpApiHandlersLayer = HttpApiBuilder.layer(PartyPlannerApi, {
  openapiPath: "/openapi.json",
}).pipe(
  Layer.provide(sessionsHandlersLayer),
  Layer.provide(authenticationLayer)
);
