// @effect-diagnostics unstableApiUsage:off
// The Worker adapter intentionally uses Effect HTTP routing.
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/http/HttpRouter";
import { HttpServerRequest } from "effect/http/HttpServerRequest";
import { AuthLive, AuthRuntimeLive } from "./auth-live.ts";
import { AuthDb, databaseLive } from "./database.ts";
import { httpLayer } from "./http.ts";

/** Same-origin API and static assets with explicit D1 persistence and HTTP request scope. */
export default class ApiWorker extends Cloudflare.Worker<ApiWorker>()(
  "Api",
  {
    main: import.meta.url,
    dev: { port: 1339 },
    compatibility: { flags: ["nodejs_compat"] },
    env: {
      AUTH_ORIGIN: Config.String("AUTH_ORIGIN").pipe(Config.withDefault("http://localhost:1339")),
    },
    limits: { cpuMs: 30_000 },
    assets: {
      directory: "./frontend/dist",
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api", "/api/*"],
    },
  },
  Effect.gen(function* () {
    const database = yield* AuthDb;
    const client = yield* Cloudflare.D1.QueryDatabase(database);
    const runtime = yield* Effect.context<Layer.Success<typeof AuthRuntimeLive>>();
    const services = AuthLive.pipe(
      Layer.provideMerge(databaseLive(client.raw)),
      Layer.provide(Layer.succeedContext(runtime)),
      Layer.orDie,
    );
    const origin = yield* Config.String("AUTH_ORIGIN").pipe(
      Config.withDefault("http://localhost:1339"),
    );
    const local = origin === "http://localhost:1339";
    const configuredHttp = httpLayer(origin);
    const viteHttp = local ? httpLayer("http://localhost:1337") : configuredHttp;
    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest;
        // Each development HTTP origin has its own fixed admission policy.
        const routes =
          local && request.headers.origin === "http://localhost:1337" ? viteHttp : configuredHttp;
        const http = yield* HttpRouter.toHttpEffect(routes).pipe(Effect.provide(services));
        return yield* http;
      }),
    };
  }).pipe(Effect.provide([AuthRuntimeLive.pipe(Layer.orDie), Cloudflare.D1.QueryDatabaseBinding])),
) {}
