// @effect-diagnostics unstableApiUsage:off
// HTTP tests intentionally exercise the Effect HTTP router.
import { BetterAuthApiError } from "@alchemy.run/better-auth/Errors";
import { expect, it } from "@effect/vitest";
import { APIError } from "better-auth";
import { Effect, Layer } from "effect";
import * as HttpRouter from "effect/http/HttpRouter";
import { Auth } from "../../backend/identity/auth.ts";
import { httpLayer } from "../../backend/http.ts";

const makeHandler = (auth: Layer.Layer<Auth>) =>
  Effect.acquireRelease(
    Effect.sync(() =>
      HttpRouter.toWebHandler(httpLayer.pipe(Layer.provide(auth)), {
        disableLogger: true,
      }),
    ),
    ({ dispose }) => Effect.promise(dispose),
  );

it.effect("public liveness works but a missing session cannot access the protected identity", () =>
  Effect.gen(function* () {
    const auth = Layer.mock(Auth, { getSession: () => Effect.succeed(null) });
    const { handler } = yield* makeHandler(auth);
    const health = yield* Effect.promise(() => handler(new Request("http://localhost/api/health")));
    expect(health.status).toBe(200);
    expect(yield* Effect.promise(() => health.json())).toEqual({ ok: true });
    const me = yield* Effect.promise(() => handler(new Request("http://localhost/api/me")));
    expect(me.status).toBe(401);
    const missing = yield* Effect.promise(() =>
      handler(new Request("http://localhost/api/auth-not-a-route")),
    );
    expect(missing.status).toBe(404);
  }),
);

it.effect("session storage outages return 503 without treating them as missing credentials", () =>
  Effect.gen(function* () {
    const auth = Layer.mock(Auth, {
      getSession: () =>
        Effect.fail(BetterAuthApiError.fromAPIError(new APIError("INTERNAL_SERVER_ERROR"))),
    });
    const { handler } = yield* makeHandler(auth);
    const me = yield* Effect.promise(() => handler(new Request("http://localhost/api/me")));
    expect(me.status).toBe(503);
    expect(yield* Effect.promise(() => me.json())).toEqual({ _tag: "AuthenticationUnavailable" });
  }),
);
