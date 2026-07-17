import { Unauthenticated } from "@party-planner/auth";
import type { CurrentIdentity } from "@party-planner/auth";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiMiddleware,
  HttpApiSchema,
} from "effect/unstable/httpapi";

import { FunctionId, Session } from "./session/domain";
import { Forbidden } from "./session/forbidden";
import { NotFound } from "./session/not-found";
import { PersistenceError } from "./session/persistence-error";

const Unauthorized = Unauthenticated.pipe(HttpApiSchema.status("Unauthorized"));
const SessionForbidden = Forbidden.pipe(HttpApiSchema.status("Forbidden"));
const SessionNotFound = NotFound.pipe(HttpApiSchema.status("NotFound"));
const SessionPersistenceError = PersistenceError.pipe(
  HttpApiSchema.status("InternalServerError")
);

/** Resolves and provides the active Staff identity for protected API endpoints. */
export class ApiAuthentication extends HttpApiMiddleware.Service<
  ApiAuthentication,
  {
    provides: CurrentIdentity;
  }
>()("@party-planner/api/ApiAuthentication", { error: Unauthorized }) {}

export const SessionsGroup = HttpApiGroup.make("sessions").add(
  HttpApiEndpoint.get("list", "/sessions", {
    error: [Unauthorized, SessionPersistenceError],
    success: Schema.Array(Session),
  }).middleware(ApiAuthentication),
  HttpApiEndpoint.get("get", "/sessions/:id", {
    error: [
      Unauthorized,
      SessionForbidden,
      SessionNotFound,
      SessionPersistenceError,
    ],
    params: { id: FunctionId },
    success: Session,
  }).middleware(ApiAuthentication)
);

export const PartyPlannerApi = HttpApi.make("partyPlanner")
  .add(SessionsGroup)
  .prefix("/api");
