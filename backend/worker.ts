// @effect-diagnostics unstableApiUsage:off
// The Worker adapter intentionally uses Effect HTTP routing.
import { CloudflareD1 } from "@alchemy.run/better-auth/CloudflareD1";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/http/HttpRouter";
import { HttpServerRequest } from "effect/http/HttpServerRequest";
import { Auth } from "./identity/auth.ts";
import { AuthDb } from "./identity/database.ts";
import { HttpLive } from "./http.ts";

/** Same-origin Better Auth, protected application API, and frontend assets on one Worker. */
export default class ApiWorker extends Cloudflare.Worker<ApiWorker>()(
  "Api",
  {
    main: import.meta.url,
    dev: { port: 1339 },
    compatibility: { flags: ["nodejs_compat"] },
    env: {
      AUTH_ORIGIN: Config.String("AUTH_ORIGIN").pipe(Config.withDefault("http://localhost:1339")),
    },
    assets: {
      directory: "./frontend/dist",
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api", "/api/*"],
    },
  },
  Effect.gen(function* () {
    const auth = yield* Auth;
    const fetch = yield* HttpRouter.toHttpEffect(HttpLive);
    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest;
        const pathname = request.url.split("?")[0];
        if (pathname === "/api/auth" || pathname?.startsWith("/api/auth/")) {
          return yield* auth.fetch;
        }
        return yield* fetch;
      }),
    };
  }).pipe(Effect.provide(Auth.layer.pipe(Layer.provide(CloudflareD1(AuthDb))))),
) {}
