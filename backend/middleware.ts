// @effect-diagnostics unstableApiUsage:off
// The authentication middleware intentionally uses Effect HTTP request markers.
import { Auth as YieldedAuth } from "@yielded/auth";
import * as Context from "effect/Context";
import * as HttpRouter from "effect/http/HttpRouter";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as HttpApiMiddleware from "effect/http-api/HttpApiMiddleware";
import { Auth } from "./auth.ts";
import { CurrentTeamMember, TeamMember } from "./current-team-member.ts";

/** No valid session was presented. */
export class Unauthorized extends Schema.TaggedError<
  Unauthorized,
  { readonly brand: unique symbol }
>()("Unauthorized", {}, { httpApiStatus: 401 }) {}
/** Session lookup failed; does not misclassify outages as invalid credentials. */
export class AuthenticationUnavailable extends Schema.TaggedError<
  AuthenticationUnavailable,
  { readonly brand: unique symbol }
>()("AuthenticationUnavailable", {}, { httpApiStatus: 503 }) {}

/** Resolves and parses the session identity before any protected handler runs. */
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  {
    provides: CurrentTeamMember;
    requires: HttpRouter.Request.From<"Requires", YieldedAuth.AuthRequest>;
  }
>()("app/Authentication", { error: [Unauthorized, AuthenticationUnavailable] }) {
  /** Uses Yielded's HTTP request scope to resolve session claims. */
  static readonly layer = Layer.effect(
    Authentication,
    Effect.gen(function* () {
      const auth = yield* Auth;
      return (httpEffect) =>
        Effect.gen(function* () {
          const session = yield* auth.getSession().pipe(
            Effect.provideServiceEffect(
              YieldedAuth.AuthRequest,
              Effect.map(
                Effect.context<HttpRouter.Request.From<"Requires", YieldedAuth.AuthRequest>>(),
                // SAFETY: Yielded HTTP middleware supplies AuthRequest before this request marker runs.
                (context) => Context.getUnsafe(context, YieldedAuth.AuthRequest),
              ),
            ),
            Effect.mapError(() => new AuthenticationUnavailable()),
          );
          if (session === null) return yield* new Unauthorized();
          const identity = yield* Schema.decodeEffect(TeamMember)(session.claims).pipe(
            Effect.mapError(() => new AuthenticationUnavailable()),
          );
          return yield* Effect.provideService(httpEffect, CurrentTeamMember, identity);
        });
    }),
  );
}
