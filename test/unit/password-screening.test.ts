import { expect, test } from "bun:test";
import { Password } from "@yielded/auth";
import { Effect, Redacted } from "effect";
import { makeScreeningLive } from "../../backend/password-screening.ts";

const password = "password";
const hashPrefix = "5BAA6";
const hashSuffix = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";
type ScreeningFetch = NonNullable<Parameters<typeof makeScreeningLive>[0]>;

const responseFor: (body: string) => ScreeningFetch = (body) => async () => new Response(body);

const check = (
  fetcher: ScreeningFetch,
  value = password,
  context: Password.PasswordScreeningContext = {},
) =>
  Effect.gen(function* () {
    const screening = yield* Password.CompromisedPasswords;
    return yield* screening.check(Redacted.make(value), context);
  }).pipe(Effect.provide(makeScreeningLive(fetcher)));

test("rejects a password found in the Pwned Passwords range response", async () => {
  let requestedUrl = "";
  let requestedHeaders: HeadersInit | undefined;
  const fetcher: ScreeningFetch = async (input, init) => {
    requestedUrl = String(input);
    requestedHeaders = init?.headers;
    return new Response(`${hashSuffix}:42\n`);
  };

  const result = await Effect.runPromise(check(fetcher));
  expect(result).toEqual({ _tag: "Rejected", reason: "compromised" });
  expect(requestedUrl).toBe(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
  expect(new Headers(requestedHeaders).get("Add-Padding")).toBe("true");
  expect(requestedUrl).not.toContain(hashSuffix);
});

test("allows a password absent from the Pwned Passwords range response", async () => {
  const result = await Effect.runPromise(
    check(responseFor("00000000000000000000000000000000000:1\n")),
  );
  expect(result).toEqual({ _tag: "Allowed" });
});

test("rejects contextual passwords without making a network request", async () => {
  let requested = false;
  const fetcher: ScreeningFetch = async () => {
    requested = true;
    return new Response("");
  };

  const result = await Effect.runPromise(
    check(fetcher, "Venue Operations", {
      serviceName: "venue operations",
    }),
  );
  expect(result).toEqual({ _tag: "Rejected", reason: "contextual" });
  expect(requested).toBe(false);
});

test("fails closed when the breach service returns an invalid range body", async () => {
  const exit = await Effect.runPromiseExit(check(responseFor("not a valid range response")));
  expect(exit._tag).toBe("Failure");
});
