// @effect-diagnostics unstableApiUsage:off
// The HTTP adapter intentionally uses Effect HTTP API builders.
import * as Http from "alchemy/Http";
import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "./api.ts";
import { publicLive } from "./health/http.ts";
import { identityLive } from "./identity/http.ts";
import { Authentication } from "./identity/middleware.ts";

/** Public health and protected identity routes; Better Auth owns its separate HTTP endpoints. */
export const HttpLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([publicLive, identityLive]),
  Layer.provide(Authentication.layer),
  Layer.provide(Http.Platform),
);
