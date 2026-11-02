import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { makeOAuthClient } from "alchemy/Auth/OAuthFlow";
import { Effect } from "effect";

test("Alchemy imports the application stack with current Effect", async () => {
  const stack = await import("../../alchemy.run.ts");
  expect(stack.default).toBeDefined();
});

test("Alchemy authorization generates random state and a valid S256 PKCE challenge", async () => {
  const client = makeOAuthClient({
    clientId: "local-regression-test",
    endpoints: {
      authorize: "https://example.com/authorize",
      token: "https://example.com/token",
    },
    redirectUri: "http://localhost/callback",
    localCallbackUri: "http://localhost/callback",
    auth: { kind: "pkce" },
  });
  const first = await Effect.runPromise(client.authorize());
  const second = await Effect.runPromise(client.authorize());
  const url = new URL(first.url);
  expect(first.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(second.state).not.toBe(first.state);
  expect(url.searchParams.get("state")).toBe(first.state);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  if (first.verifier === undefined) throw new Error("PKCE authorization omitted its verifier");
  expect(first.verifier).toMatch(/^[A-Za-z0-9_-]{128}$/);
  expect(url.searchParams.get("code_challenge")).toBe(
    createHash("sha256").update(first.verifier).digest("base64url"),
  );
});
