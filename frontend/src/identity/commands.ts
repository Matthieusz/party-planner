import { Effect, Option } from "effect";
import { Command } from "foldkit";
import { AuthClient, AuthenticationInput } from "./auth-client.ts";
import { IdentityClient } from "./identity-client.ts";
import { Message } from "./message.ts";
import type { RequestFailed } from "./request-failed.ts";

const loadIdentity = Effect.fn("Identity.loadIdentity")(function* () {
  const client = yield* IdentityClient;
  const identity = yield* client.get;
  return Message.LoadedIdentity({ identity: Option.getOrNull(identity) });
});

const failureMessage = (error: RequestFailed) =>
  Effect.succeed(Message.FailedRequest({ message: error.message }));

/** Checks the protected identity capability; no client-side cache is authoritative. */
export const CheckIdentity = Command.define("CheckIdentity", {
  messages: [Message.LoadedIdentity, Message.FailedRequest],
  execute: loadIdentity().pipe(Effect.catchTag("RequestFailed", failureMessage)),
});

/** Authenticates, then verifies the server session before publishing an identity. */
export const Authenticate = Command.define("Authenticate", {
  args: AuthenticationInput.fields,
  messages: [Message.LoadedIdentity, Message.FailedRequest],
  execute: (input) =>
    Effect.gen(function* () {
      const client = yield* AuthClient;
      yield* client.authenticate(input);
      return yield* loadIdentity();
    }).pipe(Effect.catchTag("RequestFailed", failureMessage)),
});

/** Clears the UI only after the authentication capability confirms sign-out. */
export const SignOut = Command.define("SignOut", {
  messages: [Message.LoadedIdentity, Message.FailedRequest],
  execute: Effect.gen(function* () {
    const client = yield* AuthClient;
    yield* client.signOut;
    return Message.LoadedIdentity({ identity: null });
  }).pipe(Effect.catchTag("RequestFailed", failureMessage)),
});
