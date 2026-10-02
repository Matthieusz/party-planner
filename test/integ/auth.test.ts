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
          cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
        },
        body: body ?? null,
        signal: AbortSignal.timeout(10_000),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";", 1)[0];
        if (pair === undefined) throw new Error("Missing cookie value");
        const separator = pair.indexOf("=");
        if (separator < 1) throw new Error("Invalid cookie");
        cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
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
    const signup = await request("/api/auth/sign-up/email", JSON.stringify(identity));
    expect(signup.status).toBe(200);
    expect(signup.headers.getSetCookie().some((cookie) => /;\s*httponly/i.test(cookie))).toBe(true);
    expect(cookies.size).toBeGreaterThan(0);
    const me = await request("/api/me");
    expect(me.status).toBe(200);
    const profile: unknown = await me.json();
    expect(profile).toEqual({ id: expect.any(String), name: identity.name, email: identity.email });
    expect(await (await request("/api/auth/get-session")).json()).toMatchObject({
      user: { email: identity.email },
    });
    expect((await request("/api/auth/sign-out", "{}")).status).toBe(200);
    expect((await request("/api/me")).status).toBe(401);
    expect(await (await request("/api/auth/get-session")).json()).toBeNull();
    expect(
      (
        await request(
          "/api/auth/sign-in/email",
          JSON.stringify({ email: identity.email, password: "incorrect-password" }),
        )
      ).status,
    ).toBe(401);
    expect((await request("/api/me")).status).toBe(401);
    expect((await request("/api/auth/sign-in/email", JSON.stringify(identity))).status).toBe(200);
    expect((await request("/api/me")).status).toBe(200);
    expect((await request("/api/auth/sign-out", "{}")).status).toBe(200);
    expect((await request("/api/me")).status).toBe(401);

    const hostile = await fetch(new URL("/api/auth/sign-in/email", origin), {
      method: "POST",
      headers: { origin: "https://untrusted.example", "content-type": "application/json" },
      body: JSON.stringify(identity),
      signal: AbortSignal.timeout(10_000),
    });
    expect(hostile.status).toBe(403);
  },
  45_000,
);
