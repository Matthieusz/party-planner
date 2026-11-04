// @effect-diagnostics unstableApiUsage:off
// HTTP tests intentionally exercise the Effect HTTP router.
import { BetterAuthApiError } from "@alchemy.run/better-auth/Errors";
import { APIError } from "better-auth";
import { expect, test } from "bun:test";
import { Effect, Layer } from "effect";
import * as HttpRouter from "effect/http/HttpRouter";
import { Auth } from "../../backend/identity/auth.ts";
import { HttpLive } from "../../backend/http.ts";

test("public liveness works but a missing session cannot access the protected identity", async () => {
  const auth = Layer.mock(Auth, { getSession: () => Effect.succeed(null) });
  const { handler, dispose } = HttpRouter.toWebHandler(HttpLive.pipe(Layer.provide(auth)), {
    disableLogger: true,
  });
  try {
    const health = await handler(new Request("http://localhost/api/health"));
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });
    const me = await handler(new Request("http://localhost/api/me"));
    expect(me.status).toBe(401);
    const missing = await handler(new Request("http://localhost/api/auth-not-a-route"));
    expect(missing.status).toBe(404);
  } finally {
    await dispose();
  }
});

test("session storage outages return 503 without treating them as missing credentials", async () => {
  const auth = Layer.mock(Auth, {
    getSession: () =>
      Effect.fail(BetterAuthApiError.fromAPIError(new APIError("INTERNAL_SERVER_ERROR"))),
  });
  const { handler, dispose } = HttpRouter.toWebHandler(HttpLive.pipe(Layer.provide(auth)), {
    disableLogger: true,
  });
  try {
    const me = await handler(new Request("http://localhost/api/me"));
    expect(me.status).toBe(503);
    expect(await me.json()).toEqual({ _tag: "AuthenticationUnavailable" });
  } finally {
    await dispose();
  }
});
