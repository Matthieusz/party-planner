// @effect-diagnostics unstableApiUsage:off
// Integration tests intentionally use the pinned @effect/vitest integration.
import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { SecureRandom } from "effect/crypto";

const baseURL = process.env.AUTH_TEST_URL;
const enabled =
  baseURL !== undefined && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname);

// Local-only: never deploys infrastructure or mutates a production database.
it.live.skipIf(!enabled)(
  "Alchemy Better Auth D1-backed same-origin authentication lifecycle",
  () =>
    Effect.gen(function* () {
      const random = yield* SecureRandom.SecureRandom;
      const runId = yield* random.uuidV4();
      yield* Effect.promise(async () => {
        if (baseURL === undefined) throw new Error("Set AUTH_TEST_URL to the local Worker URL.");
        const origin = new URL(baseURL).origin;
        const cookies = new Map<string, string>();
        const cookieHeader = () =>
          [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
        const request = async (path: string, body?: string) => {
          const response = await fetch(new URL(path, origin), {
            method: body === undefined ? "GET" : "POST",
            headers: {
              origin,
              "content-type": "application/json",
              cookie: cookieHeader(),
            },
            body: body ?? null,
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
        expect(await (await request("/api/auth/get-session")).json()).toBeNull();

        const identity = {
          name: "Local Team Member",
          email: `local-${runId}@example.com`,
          password: "local-test-password-123",
        };
        const signup = await request("/api/auth/sign-up/email", JSON.stringify(identity));
        expect(signup.status).toBe(200);
        expect(signup.headers.getSetCookie().some((cookie) => /;\s*httponly/i.test(cookie))).toBe(
          true,
        );
        expect(cookies.size).toBeGreaterThan(0);
        const me = await request("/api/me");
        expect(me.status).toBe(200);
        const profile: unknown = await me.json();
        expect(profile).toEqual({
          id: expect.any(String),
          name: identity.name,
          email: identity.email,
        });
        expect(await (await request("/api/auth/get-session")).json()).toMatchObject({
          user: { email: identity.email },
        });
        const oldCookie = cookieHeader();
        expect((await request("/api/auth/sign-out", "{}")).status).toBe(200);
        const revoked = await fetch(new URL("/api/me", origin), { headers: { cookie: oldCookie } });
        expect(revoked.status).toBe(401);
        expect((await request("/api/me")).status).toBe(401);
        expect(await (await request("/api/auth/get-session")).json()).toBeNull();

        const wrongPassword = await request(
          "/api/auth/sign-in/email",
          JSON.stringify({ email: identity.email, password: "incorrect-password" }),
        );
        expect(wrongPassword.status).toBe(401);
        expect((await request("/api/me")).status).toBe(401);
        expect((await request("/api/auth/sign-in/email", JSON.stringify(identity))).status).toBe(
          200,
        );
        expect(await (await request("/api/me")).json()).toEqual(profile);
        expect((await request("/api/auth/sign-out", "{}")).status).toBe(200);

        // Existing-email submissions cannot replace another user's credentials or identity.
        const duplicate = await request(
          "/api/auth/sign-up/email",
          JSON.stringify({
            ...identity,
            name: "Replacement",
            password: "different-local-password-123",
          }),
        );
        expect(duplicate.ok).toBe(false);
        expect((await request("/api/auth/sign-in/email", JSON.stringify(identity))).status).toBe(
          200,
        );
        expect(await (await request("/api/me")).json()).toEqual(profile);
        expect((await request("/api/auth/sign-out", "{}")).status).toBe(200);

        const hostile = await fetch(new URL("/api/auth/sign-in/email", origin), {
          method: "POST",
          keepalive: false,
          headers: {
            origin: "https://untrusted.example",
            "content-type": "application/json",
          },
          body: JSON.stringify(identity),
          signal: AbortSignal.timeout(10_000),
        });
        expect(hostile.status).toBe(403);

        const viteSignin = await fetch(new URL("/api/auth/sign-in/email", origin), {
          method: "POST",
          headers: { origin: "http://localhost:1337", "content-type": "application/json" },
          body: JSON.stringify(identity),
          signal: AbortSignal.timeout(10_000),
        });
        expect(viteSignin.status).toBe(200);
        // Revoke the session created through the development frontend origin as well.
        const viteCookie = viteSignin.headers
          .getSetCookie()
          .map((cookie) => cookie.split(";", 1)[0])
          .join("; ");
        const viteSignout = await fetch(new URL("/api/auth/sign-out", origin), {
          method: "POST",
          headers: {
            origin: "http://localhost:1337",
            "content-type": "application/json",
            cookie: viteCookie,
          },
          body: "{}",
        });
        expect(viteSignout.status).toBe(200);
      });
    }).pipe(Effect.provide(SecureRandom.layerWebCrypto)),
  45_000,
);
