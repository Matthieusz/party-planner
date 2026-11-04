// @effect-diagnostics unstableApiUsage:off
// Effect tests intentionally use the pinned @effect/vitest integration.
import { expect, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Option, Redacted, Ref } from "effect";
import { TestClock } from "effect/testing";
import { AuthClient } from "../../../frontend/src/identity/auth-client.ts";
import { Authenticate, CheckIdentity, SignOut } from "../../../frontend/src/identity/commands.ts";
import { IdentityClient } from "../../../frontend/src/identity/identity-client.ts";
import { Message } from "../../../frontend/src/identity/message.ts";
import { RequestFailed } from "../../../frontend/src/identity/request-failed.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };
const credentials = {
  name: "Alex",
  email: identity.email,
  password: Redacted.make("local-password-123"),
};

it.effect.each([Option.some(identity), Option.none()])(
  "identity command translates application lookup values into messages",
  (value) =>
    Effect.gen(function* () {
      const result = yield* CheckIdentity().effect.pipe(
        Effect.provideService(IdentityClient, { get: Effect.succeed(value) }),
      );
      expect(result).toEqual(Message.LoadedIdentity({ identity: Option.getOrNull(value) }));
    }),
);

it.effect("identity command projects only the safe failure message", () =>
  Effect.gen(function* () {
    const result = yield* CheckIdentity().effect.pipe(
      Effect.provideService(IdentityClient, {
        get: Effect.fail(
          new RequestFailed({
            message: "Unable to verify your session.",
            cause: Redacted.make(new Error("private transport details")),
          }),
        ),
      }),
    );
    expect(result).toEqual(Message.FailedRequest({ message: "Unable to verify your session." }));
    expect(JSON.stringify(result)).not.toContain("private transport details");
  }),
);

it.effect.each(["sign-in", "sign-up"] as const)(
  "successful %s passes application credentials and verifies the server identity",
  (mode) =>
    Effect.gen(function* () {
      const input = { mode, ...credentials };
      const result = yield* Authenticate(input).effect.pipe(
        Effect.provideService(AuthClient, {
          authenticate: (received) =>
            Effect.sync(() => {
              expect(received).toEqual(input);
            }),
          signOut: Effect.die("Unexpected sign-out"),
        }),
        Effect.provideService(IdentityClient, { get: Effect.succeedSome(identity) }),
      );
      expect(result).toEqual(Message.LoadedIdentity({ identity }));
    }),
);

it.effect("authentication waits for capability completion before checking identity", () =>
  Effect.gen(function* () {
    const started = yield* Deferred.make<void>();
    const checked = yield* Ref.make(false);
    const pending = yield* Authenticate({ mode: "sign-in", ...credentials }).effect.pipe(
      Effect.provideService(AuthClient, {
        authenticate: () =>
          Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.sleep("1 second"))),
        signOut: Effect.die("Unexpected sign-out"),
      }),
      Effect.provideService(IdentityClient, {
        get: Ref.set(checked, true).pipe(Effect.as(Option.some(identity))),
      }),
      Effect.forkScoped,
    );
    yield* Deferred.await(started);
    expect(yield* Ref.get(checked)).toBe(false);
    yield* TestClock.adjust("1 second");
    expect(yield* Fiber.join(pending)).toEqual(Message.LoadedIdentity({ identity }));
    expect(yield* Ref.get(checked)).toBe(true);
  }),
);

it.effect("failed authentication does not request an identity", () =>
  Effect.gen(function* () {
    const result = yield* Authenticate({ mode: "sign-in", ...credentials }).effect.pipe(
      Effect.provideService(AuthClient, {
        authenticate: () => Effect.fail(new RequestFailed({ message: "Sign in failed." })),
        signOut: Effect.die("Unexpected sign-out"),
      }),
      Effect.provideService(IdentityClient, { get: Effect.die("Unexpected identity lookup") }),
    );
    expect(result).toEqual(Message.FailedRequest({ message: "Sign in failed." }));
  }),
);

it.layer(
  Layer.succeed(AuthClient, {
    authenticate: () => Effect.void,
    signOut: Effect.die("Unexpected sign-out"),
  }),
)("after successful authentication", (it) => {
  it.effect.each([
    Option.none(),
    Option.some(new RequestFailed({ message: "Session verification failed." })),
  ])("does not invent an identity when verification is absent or fails", (failure) =>
    Effect.gen(function* () {
      const result = yield* Authenticate({ mode: "sign-in", ...credentials }).effect.pipe(
        Effect.provideService(IdentityClient, {
          get: Option.match(failure, {
            onNone: () => Effect.succeedNone,
            onSome: Effect.fail,
          }),
        }),
      );
      expect(result).toEqual(
        Option.match(failure, {
          onNone: () => Message.LoadedIdentity({ identity: null }),
          onSome: ({ message }) => Message.FailedRequest({ message }),
        }),
      );
    }),
  );
});

it.effect.each([true, false])(
  "sign-out only clears the identity on capability success (%s)",
  (success) =>
    Effect.gen(function* () {
      const result = yield* SignOut().effect.pipe(
        Effect.provideService(AuthClient, {
          authenticate: () => Effect.die("Unexpected authentication"),
          signOut: success
            ? Effect.void
            : Effect.fail(
                new RequestFailed({
                  message: "Sign out failed. Your session may still be active.",
                }),
              ),
        }),
      );
      expect(result).toEqual(
        success
          ? Message.LoadedIdentity({ identity: null })
          : Message.FailedRequest({
              message: "Sign out failed. Your session may still be active.",
            }),
      );
    }),
);
