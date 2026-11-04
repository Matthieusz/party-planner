// @effect-diagnostics unstableApiUsage:off
// The HTTP adapter intentionally uses Effect HTTP API builders.
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { Api } from "../api.ts";
import { CurrentTeamMember } from "./current-team-member.ts";

/** Returns the authenticated request identity. */
export const identityLive = HttpApiBuilder.group(Api, "identity", (handlers) =>
  handlers.handle("me", () => CurrentTeamMember),
);
