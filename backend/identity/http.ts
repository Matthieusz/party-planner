// @effect-diagnostics unstableApiUsage:off
// The HTTP adapter intentionally uses Effect HTTP API builders.
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "../api.ts";
import { CurrentIdentity } from "./current-identity.ts";

/** Returns the authenticated request identity. */
export const identityHttpLayer = HttpApiBuilder.group(Api, "identity", (handlers) =>
  handlers.handle("me", () => CurrentIdentity),
);
