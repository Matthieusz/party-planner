// @effect-diagnostics unstableApiUsage:off
// The identity contract intentionally uses Effect HTTP API.
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import { TeamMember } from "../../shared/identity/team-member.ts";
import { Authentication } from "./middleware.ts";

/** Endpoints requiring an authenticated individual identity. */
export class IdentityApi extends HttpApiGroup.make("identity")
  .add(HttpApiEndpoint.get("me", "/api/me", { success: TeamMember }))
  .middleware(Authentication) {}
