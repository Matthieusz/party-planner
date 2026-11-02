import { expect, test } from "bun:test";
import { Password } from "@yielded/auth";
import { Effect, Redacted } from "effect";
import { AuthRuntimeLive } from "../../backend/auth-live.ts";

test("authentication runtime hashes and verifies Argon2id passwords", async () => {
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const hashing = yield* Password.PasswordHashing;
      const password = Redacted.make("adapter-migration-password-123");
      const verifier = yield* hashing.hash(password);
      const accepted = yield* hashing.verify(password, verifier);
      const rejected = yield* hashing.verify(Redacted.make("wrong-password"), verifier);
      return { accepted, rejected };
    }).pipe(Effect.provide(AuthRuntimeLive)),
  );
  expect(result.accepted).toEqual({ matches: true, needsRehash: false });
  expect(result.rejected).toEqual({ matches: false, needsRehash: false });
});
