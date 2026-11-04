import { createAuthClient } from "better-auth/client";
import { Context, Effect, Layer, Redacted, Schema } from "effect";
import { RequestFailed } from "./request-failed.ts";

/** Application authentication input; passwords stay redacted until the vendor call. */
export const AuthenticationInput = Schema.Struct({
  mode: Schema.Literals(["sign-in", "sign-up"]),
  name: Schema.String,
  email: Schema.String,
  password: Schema.Redacted(Schema.String),
});
/** Credentials accepted by the authentication capability, without vendor types. */
export interface AuthenticationInput extends Schema.Schema.Type<typeof AuthenticationInput> {}

/** Session mutation capabilities; success never substitutes for protected identity verification. */
export class AuthClient extends Context.Service<
  AuthClient,
  {
    readonly authenticate: (input: AuthenticationInput) => Effect.Effect<void, RequestFailed>;
    readonly signOut: Effect.Effect<void, RequestFailed>;
  }
>()("app/AuthClient") {}

/** Acquires Better Auth inside the runtime; transport and vendor results stay inside this adapter. */
export const authClientLayer = (
  origin: string,
  fetchRequest: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) =>
  Layer.sync(AuthClient, () => {
    const client = createAuthClient({
      baseURL: origin,
      fetchOptions: { customFetchImpl: fetchRequest, retry: 0 },
    });
    return AuthClient.of({
      authenticate: Effect.fn("AuthClient.authenticate")(function* ({
        mode,
        name,
        email,
        password,
      }: AuthenticationInput) {
        const result = yield* Effect.tryPromise({
          try: (signal) =>
            mode === "sign-up"
              ? client.signUp.email({ name, email, password: Redacted.value(password) }, { signal })
              : client.signIn.email({ email, password: Redacted.value(password) }, { signal }),
          catch: (cause) =>
            new RequestFailed({
              message: "Unable to reach the server. Please try again.",
              cause: Redacted.make(cause),
            }),
        });
        if (result.error)
          return yield* new RequestFailed({
            message:
              mode === "sign-up"
                ? "Sign up failed. Use a valid email and a password of at least 8 characters."
                : "Sign in failed. Check your email and password.",
            cause: Redacted.make(result.error),
          });
      }),
      signOut: Effect.gen(function* () {
        const message = "Sign out failed. Your session may still be active.";
        const result = yield* Effect.tryPromise({
          try: (signal) => client.signOut({}, { signal }),
          catch: (cause) => new RequestFailed({ message, cause: Redacted.make(cause) }),
        });
        if (result.error)
          return yield* new RequestFailed({ message, cause: Redacted.make(result.error) });
      }).pipe(Effect.withSpan("AuthClient.signOut")),
    });
  });
