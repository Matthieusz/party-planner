// @effect-diagnostics unstableApiUsage:off
// The HTTP adapter intentionally uses Effect HTTP API builders.
import { Http as AuthHttp } from "@yielded/auth";
import * as Http from "alchemy/Http";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "./api.ts";
import { Auth } from "./auth.ts";
import { CurrentTeamMember } from "./current-team-member.ts";
import { Authentication } from "./middleware.ts";

const publicLive = HttpApiBuilder.group(Api, "public", (handlers) =>
  handlers.handle("health", () => Effect.succeed({ ok: true as const })),
);
const identityLive = HttpApiBuilder.group(Api, "identity", (handlers) =>
  handlers.handle("me", () => CurrentTeamMember),
);

/** Effect HTTP API and Yielded's native auth group share request credentials and cookie delivery. */
export const httpLayer = (origin: string) => {
  const http = AuthHttp.make(Auth, { origin, cookie: { secure: origin.startsWith("https:") } });
  return HttpApiBuilder.layer(Api).pipe(
    Layer.provide([publicLive, identityLive, http.handlers(Api)]),
    Layer.provide(Authentication.layer),
    http.middleware,
    Layer.provide(Http.Platform),
    Layer.orDie,
  );
};

/** Default local routes; production receives an explicit configured origin. */
export const HttpLive = httpLayer("http://localhost:1339");
