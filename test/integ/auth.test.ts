import { expect, test } from "bun:test";

const baseURL = process.env.AUTH_TEST_URL;
const enabled =
  baseURL !== undefined && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname);

// Local-only: never deploys infrastructure or mutates a production database.
test.skipIf(!enabled)(
  "D1-backed same-origin authentication lifecycle",
  async () => {
    if (baseURL === undefined) throw new Error("Set AUTH_TEST_URL to the local Worker URL.");
    const origin = new URL(baseURL).origin;
    const cookies = new Map<string, string>();
    const request = async (path: string, body?: string) => {
      const response = await fetch(new URL(path, origin), {
        method: body ? "POST" : "GET",
        headers: {
          origin,
          "content-type": "application/json",
          "x-effect-auth-csrf": "1",
          cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
        },
        body: body === undefined ? null : JSON.stringify({ payload: JSON.parse(body) }),
        signal: AbortSignal.timeout(10_000),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";", 1)[0];
        if (pair === undefined) throw new Error("Missing cookie value");
        const separator = pair.indexOf("=");
        if (separator < 1) throw new Error("Invalid cookie");
        const name = pair.slice(0, separator);
        if (/;\s*max-age=0(?:;|$)/i.test(cookie)) cookies.delete(name);
        else cookies.set(name, pair.slice(separator + 1));
      }
      return response;
    };
    expect((await request("/")).status).toBe(200);
    expect(await (await request("/api/health")).json()).toEqual({ ok: true });
    expect((await request("/api/me")).status).toBe(401);
    expect((await request("/api/auth-not-a-route")).status).toBe(404);

    const identity = {
      name: "Local Team Member",
      email: `local-${crypto.randomUUID()}@example.com`,
      password: "local-test-password-123",
    };
    const registration = JSON.stringify({
      requestId: crypto.randomUUID(),
      email: identity.email,
      newPassword: identity.password,
      registration: { name: identity.name },
    });
    const signup = await request("/api/auth/register", registration);
    expect(signup.status).toBe(200);
    const retries = await Promise.all([
      request("/api/auth/register", registration),
      request("/api/auth/register", registration),
    ]);
    for (const retry of retries) {
      if (retry.status === 200) {
        expect(await retry.json()).toEqual({
          _tag: "Success",
          value: { _tag: "RegistrationAccepted" },
        });
      } else {
        expect(retry.status).toBe(400);
        expect(await retry.json()).toMatchObject({
          _tag: "Failure",
          error: { _tag: "PasswordUnavailable" },
        });
      }
    }
    expect((await request("/api/auth/register", registration)).status).toBe(200);
    expect((await request("/api/me")).status).toBe(401);
    const signin = await request("/api/auth/signIn", JSON.stringify(identity));
    expect(signin.status).toBe(200);
    expect(signin.headers.getSetCookie().some((cookie) => /;\s*httponly/i.test(cookie))).toBe(true);
    expect(cookies.size).toBeGreaterThan(0);
    const me = await request("/api/me");
    expect(me.status).toBe(200);
    const profile: unknown = await me.json();
    expect(profile).toEqual({ id: expect.any(String), name: identity.name, email: identity.email });
    expect(await (await request("/api/auth/getSession", "{}")).json()).toMatchObject({
      _tag: "Success",
      value: { claims: { email: identity.email } },
    });
    const oldCookie = [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    expect((await request("/api/auth/signOut", "{}")).status).toBe(200);
    const revoked = await fetch(new URL("/api/me", origin), { headers: { cookie: oldCookie } });
    expect(revoked.status).toBe(401);
    expect((await request("/api/me")).status).toBe(401);
    expect(await (await request("/api/auth/getSession", "{}")).json()).toEqual({
      _tag: "Success",
      value: null,
    });
    expect(
      (
        await request(
          "/api/auth/signIn",
          JSON.stringify({ email: identity.email, password: "incorrect-password" }),
        )
      ).status,
    ).toBe(400);
    expect((await request("/api/me")).status).toBe(401);
    expect((await request("/api/auth/signIn", JSON.stringify(identity))).status).toBe(200);
    expect((await request("/api/me")).status).toBe(200);
    expect((await request("/api/auth/signOut", "{}")).status).toBe(200);
    expect((await request("/api/me")).status).toBe(401);

    // Registration retries and existing-email submissions never replace credentials.
    const duplicate = await request(
      "/api/auth/register",
      JSON.stringify({
        requestId: crypto.randomUUID(),
        email: identity.email,
        newPassword: "different-local-password-123",
        registration: { name: "Replacement" },
      }),
    );
    expect(duplicate.status).toBe(200);
    expect((await request("/api/auth/signIn", JSON.stringify(identity))).status).toBe(200);
    expect(await (await request("/api/me")).json()).toEqual(profile);
    expect((await request("/api/auth/signOut", "{}")).status).toBe(200);

    const blocked = await request(
      "/api/auth/register",
      JSON.stringify({
        requestId: crypto.randomUUID(),
        email: `blocked-${crypto.randomUUID()}@example.com`,
        newPassword: "password123",
        registration: { name: identity.name },
      }),
    );
    expect(blocked.status).toBe(400);
    expect(await blocked.json()).toMatchObject({
      _tag: "Failure",
      error: { _tag: "NewPasswordRejected", reason: "compromised" },
    });
    const missingCsrf = await fetch(new URL("/api/auth/signIn", origin), {
      method: "POST",
      // Bun must not reuse a connection after the server rejects an unread request body.
      keepalive: false,
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ payload: identity }),
    });
    expect(missingCsrf.status).toBe(403);
    expect(await missingCsrf.json()).toEqual({ _tag: "TransportFailure", reason: "csrf" });

    // Repeated requests rebuild services but keep the same durable identifier budget.
    for (let attempt = 0; attempt < 10; attempt++) {
      expect(
        (
          await request(
            "/api/auth/signIn",
            JSON.stringify({ email: identity.email, password: "wrong-password" }),
          )
        ).status,
      ).toBe(400);
    }
    expect((await request("/api/auth/signIn", JSON.stringify(identity))).status).toBe(400);
    expect((await request("/api/me")).status).toBe(401);

    const hostile = await fetch(new URL("/api/auth/signIn", origin), {
      method: "POST",
      keepalive: false,
      headers: {
        origin: "https://untrusted.example",
        "content-type": "application/json",
        "x-effect-auth-csrf": "1",
      },
      body: JSON.stringify({ payload: identity }),
      signal: AbortSignal.timeout(10_000),
    });
    expect(hostile.status).toBe(403);
  },
  45_000,
);
