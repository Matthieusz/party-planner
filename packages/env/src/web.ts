import { Schema } from "effect";

const HTTP_URL_PATTERN = /^https?:\/\//u;

const HttpUrl = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(HTTP_URL_PATTERN, {
      message: "Expected an HTTP or HTTPS URL",
    })
  )
);

const WebEnvironment = Schema.Struct({
  VITE_SERVER_URL: HttpUrl,
});

/** Browser-public environment decoded once through Effect Schema at startup. */
export const env = Schema.decodeUnknownSync(WebEnvironment)(import.meta.env);
