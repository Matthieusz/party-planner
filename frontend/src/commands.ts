import { Effect, Redacted, Schema } from "effect";
import { Command } from "foldkit";
import { TeamMember } from "../../backend/current-team-member.ts";
import { AuthClient } from "./auth-client.ts";
import { Message, Password } from "./message.ts";

class RequestFailed extends Schema.TaggedError<RequestFailed, { readonly brand: unique symbol }>()(
  "RequestFailed",
  {
    message: Schema.String,
    cause: Schema.optionalKey(Schema.Defect()),
  },
) {}

const request = Effect.fn("AuthClient.request")(function* (path: string) {
  return yield* Effect.tryPromise({
    try: (signal) =>
      fetch(path, {
        method: "GET",
        credentials: "same-origin",
        signal,
      }),
    catch: (cause) =>
      new RequestFailed({ message: "Unable to reach the server. Please try again.", cause }),
  });
});

const loadIdentity = Effect.fn("AuthClient.loadIdentity")(function* () {
  const response = yield* request("/api/me");
  if (response.status === 401) return Message.LoadedIdentity({ member: null });
  if (!response.ok)
    return yield* new RequestFailed({
      message: "Unable to verify your session. Please try again.",
    });
  const body: unknown = yield* Effect.tryPromise({
    try: () => response.json(),
    catch: (cause) =>
      new RequestFailed({ message: "The server returned an invalid response.", cause }),
  });
  const member = yield* Schema.decodeUnknownEffect(TeamMember)(body).pipe(
    Effect.mapError(
      (cause) => new RequestFailed({ message: "The server returned an invalid identity.", cause }),
    ),
  );
  return Message.LoadedIdentity({ member });
});

const failureMessage = (error: RequestFailed) =>
  Effect.succeed(Message.FailedRequest({ message: error.message }));

/** Checks the protected API; no client-side identity cache is authoritative. */
export const CheckIdentity = Command.define("CheckIdentity", {
  messages: [Message.LoadedIdentity, Message.FailedRequest],
  execute: loadIdentity().pipe(Effect.catchTag("RequestFailed", failureMessage)),
});

/** Authenticates with Yielded Auth, then verifies access through the protected API. */
export const Authenticate = Command.define("Authenticate", {
  args: {
    mode: Schema.Literals(["sign-in", "sign-up"]),
    name: Schema.String,
    email: Schema.String,
    password: Password,
  },
  messages: [Message.LoadedIdentity, Message.FailedRequest],
  execute: ({ mode, name, email, password }) =>
    Effect.gen(function* () {
      const client = yield* AuthClient;
      if (mode === "sign-up") {
        yield* client.auth
          .register({
            requestId: crypto.randomUUID(),
            email,
            newPassword: Redacted.value(password),
            registration: { name },
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new RequestFailed({
                  message:
                    error._tag === "PasswordUnavailable" ||
                    error._tag === "PasswordCheckUnavailable" ||
                    error._tag === "OperationHttpError"
                      ? "Sign up is temporarily unavailable. Please try again."
                      : "Sign up failed. Use a valid email and a password of at least 8 characters that is not commonly used.",
                }),
            ),
          );
      }
      const signedIn = yield* client.auth
        .signIn({ email, password: Redacted.value(password) })
        .pipe(
          Effect.mapError(
            (error) =>
              new RequestFailed({
                message:
                  error._tag === "PasswordUnavailable" || error._tag === "OperationHttpError"
                    ? "Sign in is temporarily unavailable. Please try again."
                    : "Sign in failed. Check your email and password.",
              }),
          ),
        );
      if (signedIn._tag !== "Authenticated")
        return yield* new RequestFailed({ message: "Additional authentication is required." });
      return yield* loadIdentity();
    }).pipe(Effect.catchTag("RequestFailed", failureMessage)),
});

/** Clears the UI only after the server has successfully ended the session. */
export const SignOut = Command.define("SignOut", {
  messages: [Message.LoadedIdentity, Message.FailedRequest],
  execute: Effect.gen(function* () {
    const client = yield* AuthClient;
    yield* client.auth.signOut().pipe(
      Effect.mapError(
        () =>
          new RequestFailed({
            message: "Sign out failed. Your session may still be active.",
          }),
      ),
    );
    return Message.LoadedIdentity({ member: null });
  }).pipe(Effect.catchTag("RequestFailed", failureMessage)),
});
