// @effect-diagnostics unstableApiUsage:off
// The application API contract intentionally uses Effect HTTP API.
import * as HttpApi from "effect/http-api/HttpApi";
import { HealthApi } from "./health/api.ts";
import { IdentityApi } from "./identity/api.ts";
/** Shared, schema-checked HTTP contract. */
export class Api extends HttpApi.make("venue-operations").add(HealthApi, IdentityApi) {}
