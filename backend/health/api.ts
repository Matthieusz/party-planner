// @effect-diagnostics unstableApiUsage:off
// The health contract intentionally uses Effect HTTP API.
import * as Schema from "effect/Schema";
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint";
import * as HttpApiGroup from "effect/http-api/HttpApiGroup";

/** Public liveness contract without account or infrastructure details. */
export class PublicApi extends HttpApiGroup.make("public").add(
  HttpApiEndpoint.get("health", "/api/health", {
    success: Schema.Struct({ ok: Schema.Literal(true) }),
  }),
) {}
