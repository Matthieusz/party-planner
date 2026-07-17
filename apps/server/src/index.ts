import { createServer } from "node:http";

import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import {
  httpApiHandlersLayer,
  PartyPlannerApi,
  sessionRepositoryLive,
  sessionServiceLayer,
} from "@party-planner/api";
import {
  LiveEventSource,
  liveEventSourceLayer,
} from "@party-planner/api/live-events";
import { AuthService, authServiceLayer } from "@party-planner/auth";
import { liveDatabaseLayer } from "@party-planner/db";
import { ServerConfig, serverConfigLayer } from "@party-planner/env/server";
import { Effect, Layer, Stream } from "effect";
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiScalar } from "effect/unstable/httpapi";
import { createRequestLogger, initLogger } from "evlog";

initLogger({ env: { service: "party-planner-server" } });

const authRoutesLayer = HttpRouter.use(
  Effect.fn("Http.authRoutes")(function* registerAuthRoutes(router) {
    const auth = yield* AuthService;
    yield* router.add("*", "/api/auth/*", (request) =>
      HttpServerRequest.toWeb(request).pipe(
        Effect.flatMap((webRequest) =>
          Effect.tryPromise(() => auth.handler(webRequest))
        ),
        Effect.map(HttpServerResponse.fromWeb),
        Effect.orDie
      )
    );
  })
);

const rootRouteLayer = HttpRouter.add(
  "GET",
  "/",
  HttpServerResponse.text("OK")
);

const textEncoder = new TextEncoder();

const liveEventsRouteLayer = HttpRouter.add(
  "GET",
  "/api/live-events",
  Effect.gen(function* liveEventsRoute() {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const auth = yield* AuthService;
    const identity = yield* auth.resolveIdentity(
      new Headers(request.headers as Record<string, string>)
    );
    const source = yield* LiveEventSource;
    const body = source
      .eventsForVenue(identity.venueId)
      .pipe(
        Stream.map((event) =>
          textEncoder.encode(
            `event: invalidate\ndata: ${JSON.stringify(event)}\n\n`
          )
        )
      );
    return HttpServerResponse.stream(body, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  }).pipe(
    Effect.catchTags({
      "Auth.ActiveVenueRequired": () =>
        Effect.succeed(HttpServerResponse.empty({ status: 401 })),
      "Auth.AdapterError": () =>
        Effect.succeed(HttpServerResponse.empty({ status: 500 })),
      "Auth.MembershipNotFound": () =>
        Effect.succeed(HttpServerResponse.empty({ status: 403 })),
      "Auth.Unauthenticated": () =>
        Effect.succeed(HttpServerResponse.empty({ status: 401 })),
    })
  )
);

const requestLoggingLayer = HttpRouter.middleware(
  (httpEffect) =>
    Effect.gen(function* logRequest() {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const logger = createRequestLogger({
        method: request.method,
        path: request.url,
      });
      const startedAt = performance.now();
      return yield* httpEffect.pipe(
        Effect.tap((response) =>
          Effect.sync(() => {
            logger.set({
              durationMs: performance.now() - startedAt,
              status: response.status,
            });
          })
        ),
        Effect.tapError((error) =>
          Effect.sync(() => {
            logger.error(error instanceof Error ? error : String(error));
          })
        ),
        Effect.ensuring(Effect.sync(() => logger.emit()))
      );
    }),
  { global: true }
);

const databaseLayer = liveDatabaseLayer.pipe(Layer.provide(serverConfigLayer));
const authenticationLayer = authServiceLayer.pipe(
  Layer.provide(serverConfigLayer)
);
const repositoryLayer = sessionRepositoryLive.pipe(
  Layer.provide(databaseLayer)
);
const sessionsLayer = sessionServiceLayer.pipe(Layer.provide(repositoryLayer));
const liveEventsLayer = liveEventSourceLayer.pipe(
  Layer.provide(serverConfigLayer)
);
const applicationServicesLayer = Layer.mergeAll(
  authenticationLayer,
  sessionsLayer,
  liveEventsLayer
);

const routesLayer = Layer.mergeAll(
  httpApiHandlersLayer,
  authRoutesLayer,
  liveEventsRouteLayer,
  rootRouteLayer,
  HttpApiScalar.layer(PartyPlannerApi, { path: "/api-reference" })
).pipe(Layer.provide(applicationServicesLayer));

const serverLayer = Layer.unwrap(
  ServerConfig.pipe(
    Effect.map((config) => {
      const applicationLayer = Layer.mergeAll(
        routesLayer,
        requestLoggingLayer,
        HttpRouter.cors({
          allowedHeaders: ["Content-Type", "Authorization"],
          allowedMethods: ["GET", "POST", "OPTIONS"],
          allowedOrigins: [config.corsOrigin],
          credentials: true,
        })
      );
      return HttpRouter.serve(applicationLayer).pipe(
        Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
      );
    })
  )
).pipe(Layer.provide(serverConfigLayer));

NodeRuntime.runMain(
  Layer.launch(serverLayer).pipe(Effect.provide(applicationServicesLayer))
);
