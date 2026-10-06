import { Password } from "@yielded/auth";
import { Effect, Layer, Redacted } from "effect";

const unavailable = () => Password.PasswordCheckUnavailable.make({});

type PasswordRangeFetcher = (
  url: string,
  init: {
    readonly headers: { readonly "Add-Padding": "true" };
    readonly signal: AbortSignal;
  },
) => Promise<Response>;

const parseRangeResponse = (body: string, suffix: string): boolean | undefined => {
  let compromised = false;
  let hasEntries = false;
  for (const line of body.split(/\r?\n/u)) {
    if (line.length === 0) continue;
    const match = /^([0-9A-F]{35}):([0-9]+)$/u.exec(line);
    if (match === null) return undefined;
    hasEntries = true;
    if (match[1] === suffix && Number(match[2]) > 0) compromised = true;
  }
  return hasEntries ? compromised : undefined;
};

/**
 * Builds the password-screening layer using HIBP's k-anonymity range API.
 * Only the first five SHA-1 characters are sent; the password and full hash stay local.
 */
export const makeScreeningLive = (fetcher: PasswordRangeFetcher = globalThis.fetch) =>
  Layer.sync(Password.CompromisedPasswords, () =>
    Password.CompromisedPasswords.of({
      check: Effect.fn("PasswordScreening.check")((password, context) =>
        Effect.gen(function* () {
          const value = Redacted.value(password).normalize("NFC");
          if (
            value.toLowerCase() === context.accountName?.normalize("NFC").toLowerCase() ||
            value.toLowerCase() === context.serviceName?.normalize("NFC").toLowerCase()
          )
            return Password.PasswordScreening.make({ _tag: "Rejected", reason: "contextual" });

          const digest = yield* Effect.tryPromise({
            try: () => globalThis.crypto.subtle.digest("SHA-1", new TextEncoder().encode(value)),
            catch: unavailable,
          });
          const hash = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          )
            .join("")
            .toUpperCase();
          const prefix = hash.slice(0, 5);
          const suffix = hash.slice(5);

          const response = yield* Effect.tryPromise({
            try: (signal) =>
              fetcher(`https://api.pwnedpasswords.com/range/${prefix}`, {
                headers: { "Add-Padding": "true" },
                signal,
              }),
            catch: unavailable,
          });
          if (!response.ok) return yield* unavailable();

          const body = yield* Effect.tryPromise({
            try: () => response.text(),
            catch: unavailable,
          });
          const compromised = parseRangeResponse(body, suffix);
          if (compromised === undefined) return yield* unavailable();
          return compromised
            ? Password.PasswordScreening.make({ _tag: "Rejected", reason: "compromised" })
            : Password.PasswordScreening.make({ _tag: "Allowed" });
        }),
      ),
    }),
  );

/** Live password screening adapter for Cloudflare Workers. */
export const ScreeningLive = makeScreeningLive();
