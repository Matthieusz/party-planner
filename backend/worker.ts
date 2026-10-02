import { CloudflareD1 } from "@alchemy.run/better-auth/CloudflareD1";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/http/HttpRouter";
import { HttpServerRequest } from "effect/http/HttpServerRequest";
import { Auth } from "./auth.ts";
import { AuthDb } from "./database.ts";
import { HttpLive } from "./http.ts";

/** Same-origin API and static Foldkit assets; owns D1 auth wiring and request scope. */
export default class ApiWorker extends Cloudflare.Worker<ApiWorker>()(
  "Api",
  {
    main: import.meta.url,
    dev: { port: 1339 },
    compatibility: { flags: ["nodejs_compat"] },
    assets: {
      directory: "./frontend/dist",
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api", "/api/*"],
    },
  },
  Effect.gen(function* () {
    const auth = yield* Auth;
    const http = yield* HttpRouter.toHttpEffect(HttpLive);
    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest;
        const pathname = new URL(request.url, "http://localhost").pathname;
        if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return yield* auth.fetch;
        return yield* http;
      }),
    };
  }).pipe(Effect.provide(Auth.layer.pipe(Layer.provide(CloudflareD1(AuthDb))))),
) {}
