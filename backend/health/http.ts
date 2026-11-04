// @effect-diagnostics unstableApiUsage:off
// The HTTP adapter intentionally uses Effect HTTP API builders.
import * as Effect from "effect/Effect";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "../api.ts";

/** Handles the public liveness endpoint. */
export const healthHttpLayer = HttpApiBuilder.group(Api, "public", (handlers) =>
  handlers.handle("health", () => Effect.succeed({ ok: true as const })),
);
