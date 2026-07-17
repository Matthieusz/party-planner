import { expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Redacted } from "effect";

import { ServerConfig, serverConfigLayer } from "./server";

const validConfiguration = {
  BETTER_AUTH_SECRET: "a-secret-that-is-at-least-32-characters",
  BETTER_AUTH_URL: "https://auth.example.test",
  CORS_ORIGIN: "https://app.example.test",
  DATABASE_URL: "postgresql://localhost/party_planner",
};

const configLayer = (configuration: Record<string, unknown>) =>
  serverConfigLayer.pipe(
    Layer.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown(configuration))
    )
  );

it.effect("decodes server configuration from an explicit provider", () =>
  Effect.gen(function* decodeServerConfiguration() {
    const config = yield* ServerConfig;

    expect(config.nodeEnv).toBe("development");
    expect(config.corsOrigin).toBe("https://app.example.test");
    expect(Redacted.value(config.databaseUrl)).toBe(
      "postgresql://localhost/party_planner"
    );
  }).pipe(Effect.provide(configLayer(validConfiguration)))
);

it.effect("rejects malformed server secrets", () =>
  Effect.gen(function* rejectMalformedServerSecret() {
    const error = yield* Effect.gen(function* decodeMalformedConfiguration() {
      return yield* ServerConfig;
    }).pipe(
      Effect.provide(
        configLayer({
          ...validConfiguration,
          BETTER_AUTH_SECRET: "too-short",
        })
      ),
      Effect.flip
    );

    expect(String(error)).toContain("BETTER_AUTH_SECRET");
  })
);
