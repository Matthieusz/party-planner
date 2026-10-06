import { AuthContract as YieldedContract } from "@yielded/auth";
import * as Schema from "effect/Schema";
import * as HttpApi from "effect/http-api/HttpApi";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";
import { TeamMember } from "./current-team-member.ts";
import { AuthContract } from "./auth-contract.ts";
import { Authentication } from "./middleware.ts";

/** Public liveness contract without account or infrastructure details. */
export class PublicApi extends HttpApiGroup.make("public").add(
  HttpApiEndpoint.get("health", "/api/health", {
    success: Schema.Struct({ ok: Schema.Literal(true) }),
  }),
) {}
/** Endpoints requiring an authenticated individual identity. */
export class IdentityApi extends HttpApiGroup.make("identity")
  .add(HttpApiEndpoint.get("me", "/api/me", { success: TeamMember }))
  .middleware(Authentication) {}
/** Shared, schema-checked HTTP contract. */
export class Api extends HttpApi.make("venue-operations").add(
  PublicApi,
  IdentityApi,
  YieldedContract.httpGroup(AuthContract),
) {}
