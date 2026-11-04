// @effect-diagnostics unstableApiUsage:off
// The HTTP adapter intentionally uses Effect HTTP API builders.
import * as Http from "alchemy/Http";
import * as Layer from "effect/Layer";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "./api.ts";
import { healthHttpLayer } from "./health/http.ts";
import { identityHttpLayer } from "./identity/http.ts";
import { Authentication } from "./identity/middleware.ts";

/** Public health and protected identity routes; Better Auth owns its separate HTTP endpoints. */
export const httpLayer = HttpApiBuilder.layer(Api).pipe(
  Layer.provide([healthHttpLayer, identityHttpLayer]),
  Layer.provide(Authentication.layer),
  Layer.provide(Http.Platform),
);
