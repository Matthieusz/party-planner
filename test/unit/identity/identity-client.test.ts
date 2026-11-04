// @effect-diagnostics unstableApiUsage:off
// Effect tests intentionally use the pinned @effect/vitest integration.
import { expect, it } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import { AuthenticatedIdentity } from "../../../shared/identity/authenticated-identity.ts";
import {
  IdentityClient,
  identityClientLayer,
} from "../../../frontend/src/identity/identity-client.ts";

const identity = { id: "identity-1", name: "Alex", email: "alex@example.com" };

it.effect.each([
  [
    "valid identity",
    () => Response.json({ ...identity, token: "private-token" }),
    Option.some(identity),
  ],
  ["unauthorized", () => new Response("not JSON", { status: 401 }), Option.none()],
] as const)("identity adapter returns an application value for %s", ([_name, response, expected]) =>
  Effect.gen(function* () {
    const client = yield* IdentityClient;
    const result = yield* client.get;
    expect(result).toEqual(expected);
    expect(JSON.stringify(result)).not.toContain("private-token");
  }).pipe(
    Effect.provide(
      identityClientLayer(async (input, init) => {
        expect(input).toBe("/api/me");
        expect(init?.method).toBe("GET");
        expect(init?.credentials).toBe("same-origin");
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        return response();
      }),
    ),
  ),
);

it.effect.each([
  [
    "server failure",
    async () => new Response("untrusted error", { status: 503 }),
    "Unable to verify your session. Please try again.",
  ],
  [
    "malformed JSON",
    async () => new Response("{invalid"),
    "The server returned an invalid response.",
  ],
  [
    "invalid identity",
    async () => Response.json({ ...identity, id: 42, secret: "private-token" }),
    "The server returned an invalid identity.",
  ],
  [
    "transport error",
    async () => {
      throw new TypeError("private transport details");
    },
    "Unable to reach the server. Please try again.",
  ],
] as const)("identity adapter reports a typed safe failure for %s", ([_name, response, message]) =>
  Effect.gen(function* () {
    const client = yield* IdentityClient;
    const result = yield* client.get.pipe(Effect.result);
    if (!Result.isFailure(result)) throw new Error("Expected lookup failure");
    expect(result.failure._tag).toBe("RequestFailed");
    expect(result.failure.message).toBe(message);
    expect(JSON.stringify(result.failure)).not.toContain("private-token");
    expect(JSON.stringify(result.failure)).not.toContain("private transport details");
  }).pipe(Effect.provide(identityClientLayer(response))),
);

it.effect.prop(
  "identity decoding preserves the public projection and discards extra transport fields",
  { identity: AuthenticatedIdentity, token: Schema.String },
  ({ identity, token }) =>
    Effect.gen(function* () {
      const client = yield* IdentityClient;
      expect(yield* client.get).toEqual(Option.some(identity));
    }).pipe(Effect.provide(identityClientLayer(async () => Response.json({ ...identity, token })))),
);
