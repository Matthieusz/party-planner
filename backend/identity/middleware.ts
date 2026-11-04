// @effect-diagnostics unstableApiUsage:off
// The authentication middleware intentionally uses Effect HTTP request markers.
import { RuntimeContext } from "alchemy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as HttpApiMiddleware from "effect/http-api/HttpApiMiddleware";
import { TeamMember } from "../../shared/identity/team-member.ts";
import { Auth } from "./auth.ts";
import { CurrentTeamMember } from "./current-team-member.ts";

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
  }
>()("app/Authentication", { error: [Unauthorized, AuthenticationUnavailable] }) {
  /** Resolves the ambient Better Auth session without converting outages into anonymous access. */
  static readonly layer = Layer.effect(
    Authentication,
    Effect.gen(function* () {
      const auth = yield* Auth;
      return (httpEffect) =>
        Effect.gen(function* () {
          const session = yield* auth
            .getSession()
            .pipe(Effect.mapError(() => new AuthenticationUnavailable()));
          if (session === null) return yield* new Unauthorized();
          const identity = yield* Schema.decodeEffect(TeamMember)({
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }).pipe(Effect.mapError(() => new AuthenticationUnavailable()));
          return yield* Effect.provideService(httpEffect, CurrentTeamMember, identity);
        }).pipe(Effect.provide(RuntimeContext.phantom));
    }),
  );
}
