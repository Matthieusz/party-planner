// @effect-diagnostics unstableApiUsage:off
// Effect tests intentionally use the pinned @effect/vitest integration.
import { expect, it } from "@effect/vitest";
import { Effect, Redacted, Result } from "effect";
import { AuthClient, authClientLayer } from "../../../frontend/src/identity/auth-client.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };
const credentials = {
  name: identity.name,
  email: identity.email,
  password: Redacted.make("local-password-123"),
};

it.effect.each(["sign-in", "sign-up"] as const)(
  "auth adapter translates %s credentials without returning vendor data",
  (mode) =>
    Effect.gen(function* () {
      const client = yield* AuthClient;
      const result = yield* client.authenticate({ mode, ...credentials });
      expect(result).toBeUndefined();
    }).pipe(
      Effect.provide(
        authClientLayer("http://localhost:1339", async (input, init) => {
          expect(new Request(input).url.endsWith(`/api/auth/${mode}/email`)).toBe(true);
          expect(init?.method).toBe("POST");
          expect(init?.signal).toBeInstanceOf(AbortSignal);
          const body: unknown = await new Request(input, init).json();
          expect(body).toEqual(
            mode === "sign-up"
              ? { name: identity.name, email: identity.email, password: "local-password-123" }
              : { email: identity.email, password: "local-password-123" },
          );
          return Response.json({ token: "private-token", user: identity });
        }),
      ),
    ),
);

it.effect.each(["sign-in", "sign-up"] as const)(
  "auth adapter translates rejected %s into safe typed failure",
  (mode) =>
    Effect.gen(function* () {
      const client = yield* AuthClient;
      const result = yield* client.authenticate({ mode, ...credentials }).pipe(Effect.result);
      if (!Result.isFailure(result)) throw new Error("Expected authentication failure");
      expect(result.failure._tag).toBe("RequestFailed");
      expect(result.failure.message).toBe(
        mode === "sign-up"
          ? "Sign up failed. Use a valid email and a password of at least 8 characters."
          : "Sign in failed. Check your email and password.",
      );
      expect(JSON.stringify(result.failure)).not.toContain("untrusted vendor details");
      expect(JSON.stringify(result.failure)).not.toContain("local-password-123");
    }).pipe(
      Effect.provide(
        authClientLayer("http://localhost:1339", async () =>
          Response.json(
            { code: "INVALID_CREDENTIALS", message: "untrusted vendor details" },
            { status: 401 },
          ),
        ),
      ),
    ),
);

it.effect.each([200, 503])("auth adapter confirms sign-out or fails safely (%s)", (status) =>
  Effect.gen(function* () {
    const client = yield* AuthClient;
    const result = yield* client.signOut.pipe(Effect.result);
    if (status === 200) expect(Result.isSuccess(result)).toBe(true);
    else {
      if (!Result.isFailure(result)) throw new Error("Expected sign-out failure");
      expect(result.failure.message).toBe("Sign out failed. Your session may still be active.");
      expect(JSON.stringify(result.failure)).not.toContain("untrusted vendor details");
    }
  }).pipe(
    Effect.provide(
      authClientLayer("http://localhost:1339", async (input, init) => {
        expect(new Request(input).url.endsWith("/api/auth/sign-out")).toBe(true);
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        return Response.json(
          status === 200 ? { success: true } : { message: "untrusted vendor details" },
          { status },
        );
      }),
    ),
  ),
);

it.effect.each(["authenticate", "signOut"] as const)(
  "auth adapter maps %s transport errors to safe failures",
  (operation) =>
    Effect.gen(function* () {
      const client = yield* AuthClient;
      const result = yield* (
        operation === "signOut"
          ? client.signOut
          : client.authenticate({ mode: "sign-in", ...credentials })
      ).pipe(Effect.result);
      if (!Result.isFailure(result)) throw new Error("Expected transport failure");
      expect(result.failure.message).toBe(
        operation === "signOut"
          ? "Sign out failed. Your session may still be active."
          : "Unable to reach the server. Please try again.",
      );
      expect(JSON.stringify(result.failure)).not.toContain("private transport details");
    }).pipe(
      Effect.provide(
        authClientLayer("http://localhost:1339", async () => {
          throw new TypeError("private transport details");
        }),
      ),
    ),
);
