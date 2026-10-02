import { RuntimeContext } from "alchemy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as HttpApiMiddleware from "effect/http-api/HttpApiMiddleware";
import { Auth } from "./auth.ts";
import { CurrentTeamMember, TeamMember } from "./current-team-member.ts";

/** No valid session was presented. */
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {},
  { httpApiStatus: 401 },
) {}
/** Session lookup failed; does not misclassify outages as invalid credentials. */
export class AuthenticationUnavailable extends Schema.TaggedError<AuthenticationUnavailable>()(
  "AuthenticationUnavailable",
  {},
  { httpApiStatus: 503 },
) {}

/** Resolves and parses the session identity before any protected handler runs. */
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentTeamMember }
>()("app/Authentication", { error: [Unauthorized, AuthenticationUnavailable] }) {
  /** Uses the Worker's owned request scope to resolve Better Auth sessions. */
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
          const identity = yield* Schema.decodeUnknownEffect(TeamMember)(session.user).pipe(
            Effect.mapError(() => new AuthenticationUnavailable()),
          );
          return yield* Effect.provideService(httpEffect, CurrentTeamMember, identity);
        }).pipe(Effect.provide(RuntimeContext.phantom));
    }),
  );
}
