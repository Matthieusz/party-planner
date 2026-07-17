import { NodeRuntime } from "@effect/platform-node";
import { serve } from "@hono/node-server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@party-planner/api/context";
import { appRouter } from "@party-planner/api/routers/index";
import { AuthService, authServiceLayer } from "@party-planner/auth";
import type { RequestIdentity } from "@party-planner/auth";
import { Database, liveDatabaseLayer } from "@party-planner/db";
import { ServerConfig, serverConfigLayer } from "@party-planner/env/server";
import { Effect, Layer, Option } from "effect";
import { initLogger } from "evlog";
import { evlog } from "evlog/hono";
import type { EvlogVariables } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { withRequestObservability } from "./effect-observability";

initLogger({ env: { service: "party-planner-server" } });

const applicationLayer = Layer.merge(authServiceLayer, liveDatabaseLayer).pipe(
  Layer.provideMerge(serverConfigLayer)
);

interface ServerVariables {
  Variables: EvlogVariables["Variables"] & {
    requestIdentity: Option.Option<RequestIdentity>;
  };
}

const main = Effect.gen(function* main() {
  const auth = yield* AuthService;
  const config = yield* ServerConfig;
  const database = yield* Database;
  const app = new Hono<ServerVariables>();

  app.use(evlog());
  app.use("*", async (context, next) => {
    if (context.req.path.startsWith("/api/auth/")) {
      context.set("requestIdentity", Option.none());
      await next();
      return;
    }
    const identity = await Effect.runPromise(
      withRequestObservability(
        context.get("log"),
        "Auth.resolveIdentity",
        auth.resolveIdentity(context.req.raw.headers)
      ).pipe(Effect.option)
    );
    context.set("requestIdentity", identity);
    if (Option.isSome(identity)) {
      context.get("log").set({
        staff: { id: identity.value.staffId, role: identity.value.role },
        venue: { id: identity.value.venueId },
      });
    }
    await next();
  });

  app.use(
    "/*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      origin: config.corsOrigin,
    })
  );

  app.on(["POST", "GET"], "/api/auth/*", (context) =>
    auth.handler(context.req.raw)
  );

  const apiHandler = new OpenAPIHandler(appRouter, {
    interceptors: [
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      onError((error) => {
        Effect.runFork(Effect.logError(error));
      }),
    ],
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
    ],
  });

  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      onError((error) => {
        Effect.runFork(Effect.logError(error));
      }),
    ],
  });

  app.use("/*", async (context, next) => {
    const rpcContext = createContext({
      database,
      identity: context.get("requestIdentity"),
    });
    const rpcResult = await rpcHandler.handle(context.req.raw, {
      context: rpcContext,
      prefix: "/rpc",
    });
    if (rpcResult.matched) {
      return context.newResponse(rpcResult.response.body, rpcResult.response);
    }

    const apiResult = await apiHandler.handle(context.req.raw, {
      context: rpcContext,
      prefix: "/api-reference",
    });
    if (apiResult.matched) {
      return context.newResponse(apiResult.response.body, apiResult.response);
    }
    await next();
  });

  app.get("/", (context) => context.text("OK"));

  yield* Effect.acquireRelease(
    Effect.sync(() => serve({ fetch: app.fetch, port: 3000 })),
    (runningServer) =>
      Effect.callback<null>((resume) => {
        runningServer.close(() => resume(Effect.as(Effect.void, null)));
      })
  );
  yield* Effect.logInfo("Server started").pipe(
    Effect.annotateLogs({ url: "http://localhost:3000" })
  );
  return yield* Effect.never;
});

NodeRuntime.runMain(main.pipe(Effect.scoped, Effect.provide(applicationLayer)));
