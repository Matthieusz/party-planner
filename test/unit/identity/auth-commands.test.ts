import { expect, test } from "bun:test";
import { createAuthClient } from "better-auth/client";
import { Effect, Redacted } from "effect";
import { AuthClient } from "../../../frontend/src/identity/auth-client.ts";
import { Authenticate, CheckIdentity, SignOut } from "../../../frontend/src/identity/commands.ts";
import { IdentityClient } from "../../../frontend/src/identity/identity-client.ts";
import { Message } from "../../../frontend/src/identity/message.ts";

test.each(["sign-in", "sign-up"] as const)(
  "Better Auth %s errors produce a safe failed message, not a signed-in identity",
  async (mode) => {
    const client = createAuthClient({
      baseURL: "http://localhost:1339",
      fetchOptions: {
        customFetchImpl: async (input, init) => {
          expect(new Request(input).url).toEndWith(`/api/auth/${mode}/email`);
          expect(init?.method).toBe("POST");
          return Response.json(
            { code: "INVALID_CREDENTIALS", message: "Untrusted server error" },
            { status: 401 },
          );
        },
      },
    });
    const result = await Effect.runPromise(
      Authenticate({
        mode,
        name: "Alex",
        email: "alex@example.com",
        password: Redacted.make("local-password-123"),
      }).effect.pipe(
        Effect.provideService(AuthClient, client),
        Effect.provideService(IdentityClient, {
          get: () => Promise.reject(new Error("Identity must not be requested on auth failure")),
        }),
      ),
    );
    expect(result).toEqual(
      Message.FailedRequest({
        message:
          mode === "sign-up"
            ? "Sign up failed. Use a valid email and a password of at least 8 characters."
            : "Sign in failed. Check your email and password.",
      }),
    );
    expect(JSON.stringify(result)).not.toContain("Untrusted server error");
    expect(JSON.stringify(result)).not.toContain("local-password-123");
  },
);

const member = { id: "member-1", name: "Alex", email: "alex@example.com" };

test.each([
  ["valid identity", () => Response.json(member), Message.LoadedIdentity({ member })],
  [
    "unauthorized",
    () => new Response(null, { status: 401 }),
    Message.LoadedIdentity({ member: null }),
  ],
  [
    "server failure",
    () => new Response("untrusted error", { status: 503 }),
    Message.FailedRequest({ message: "Unable to verify your session. Please try again." }),
  ],
  [
    "malformed JSON",
    () => new Response("{invalid"),
    Message.FailedRequest({ message: "The server returned an invalid response." }),
  ],
  [
    "invalid identity",
    () => Response.json({ ...member, id: 42 }),
    Message.FailedRequest({ message: "The server returned an invalid identity." }),
  ],
] as const)("identity check handles %s", async (_description, response, expected) => {
  const result = await Effect.runPromise(
    CheckIdentity().effect.pipe(
      Effect.provideService(IdentityClient, { get: async () => response() }),
    ),
  );
  expect(result).toEqual(expected);
});

test("identity transport errors produce a safe failure", async () => {
  const result = await Effect.runPromise(
    CheckIdentity().effect.pipe(
      Effect.provideService(IdentityClient, {
        get: () => Promise.reject(new Error("private transport details")),
      }),
    ),
  );
  expect(result).toEqual(
    Message.FailedRequest({ message: "Unable to reach the server. Please try again." }),
  );
});

test.each(["sign-in", "sign-up"] as const)(
  "successful %s verifies the session through the identity client",
  async (mode) => {
    const client = createAuthClient({
      baseURL: "http://localhost:1339",
      fetchOptions: {
        retry: 0,
        customFetchImpl: async (input) => {
          expect(new Request(input).url).toEndWith(`/api/auth/${mode}/email`);
          return Response.json({ token: "session", user: member });
        },
      },
    });
    const result = await Effect.runPromise(
      Authenticate({
        mode,
        name: "Alex",
        email: "alex@example.com",
        password: Redacted.make("local-password-123"),
      }).effect.pipe(
        Effect.provideService(AuthClient, client),
        Effect.provideService(IdentityClient, { get: async () => Response.json(member) }),
      ),
    );
    expect(result).toEqual(Message.LoadedIdentity({ member }));
  },
);

test.each([200, 503])(
  "sign-out only clears identity after Better Auth succeeds (%s)",
  async (status) => {
    const client = createAuthClient({
      baseURL: "http://localhost:1339",
      fetchOptions: {
        retry: 0,
        customFetchImpl: async (input) => {
          expect(new Request(input).url).toEndWith("/api/auth/sign-out");
          return Response.json(status === 200 ? { success: true } : { message: "Unavailable" }, {
            status,
          });
        },
      },
    });
    const result = await Effect.runPromise(
      SignOut().effect.pipe(Effect.provideService(AuthClient, client)),
    );
    expect(result).toEqual(
      status === 200
        ? Message.LoadedIdentity({ member: null })
        : Message.FailedRequest({ message: "Sign out failed. Your session may still be active." }),
    );
  },
);

test("a browser transport failure remains a safe sign-out failure", async () => {
  const client = createAuthClient({
    baseURL: "http://localhost:1339",
    fetchOptions: {
      retry: 0,
      customFetchImpl: async () => {
        throw new TypeError("Network unavailable");
      },
    },
  });
  const result = await Effect.runPromise(
    SignOut().effect.pipe(Effect.provideService(AuthClient, client)),
  );
  expect(result).toEqual(
    Message.FailedRequest({ message: "Sign out failed. Your session may still be active." }),
  );
});
