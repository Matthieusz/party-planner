import { BetterAuth } from "@alchemy.run/better-auth";
import { Config, Context, Effect, Layer } from "effect";

const makeAuth = Effect.gen(function* () {
  const origin = yield* Config.String("AUTH_ORIGIN").pipe(
    Config.withDefault("http://localhost:1339"),
  );
  const auth = yield* BetterAuth({
    baseURL: origin,
    basePath: "/api/auth",
    trustedOrigins:
      origin === "http://localhost:1339" ? [origin, "http://localhost:1337"] : [origin],
    emailAndPassword: { enabled: true },
  });
  return { fetch: auth.fetch, getSession: auth.getSession };
});

/**
 * Alchemy-managed Better Auth with D1 sessions and a stable managed signing secret.
 * @effect-expect-leaking RuntimeContext
 */
export class Auth extends Context.Service<Auth, Effect.Success<typeof makeAuth>>()("app/Auth") {
  /** Construct auth once at the Worker composition root; database access remains request-scoped. */
  static readonly layer = Layer.effect(Auth, makeAuth);
}
