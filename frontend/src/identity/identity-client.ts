import { Context, Effect, Layer, Option, Redacted, Schema } from "effect";
import { AuthenticatedIdentity } from "../../../shared/identity/authenticated-identity.ts";
import { RequestFailed } from "./request-failed.ts";

/** Looks up the verified server identity; no session is distinct from a failed lookup. */
export class IdentityClient extends Context.Service<
  IdentityClient,
  { readonly get: Effect.Effect<Option.Option<AuthenticatedIdentity>, RequestFailed> }
>()("app/IdentityClient") {}

/** Same-origin HTTP adapter; owns status classification, decoding, and cancellation. */
export const identityClientLayer = (
  fetchRequest: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) =>
  Layer.succeed(IdentityClient, {
    get: Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: (signal) =>
          fetchRequest("/api/me", { method: "GET", credentials: "same-origin", signal }),
        catch: (cause) =>
          new RequestFailed({
            message: "Unable to reach the server. Please try again.",
            cause: Redacted.make(cause),
          }),
      });
      if (response.status === 401) return Option.none();
      if (!response.ok)
        return yield* new RequestFailed({
          message: "Unable to verify your session. Please try again.",
        });
      const body: unknown = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (cause) =>
          new RequestFailed({
            message: "The server returned an invalid response.",
            cause: Redacted.make(cause),
          }),
      });
      const identity = yield* Schema.decodeUnknownEffect(AuthenticatedIdentity)(body).pipe(
        Effect.mapError(
          (cause) =>
            new RequestFailed({
              message: "The server returned an invalid identity.",
              cause: Redacted.make(cause),
            }),
        ),
      );
      return Option.some(identity);
    }).pipe(Effect.withSpan("IdentityClient.get")),
  });
