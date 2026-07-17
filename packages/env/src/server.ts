import "dotenv/config";
import type { Redacted } from "effect";
import { Config, Context, Effect, Layer, Schema } from "effect";

const Environment = Schema.Literals(["development", "production", "test"]);
const Url = Schema.String.pipe(Schema.check(Schema.isPattern(/^https?:\/\//u)));
const Secret = Schema.NonEmptyString.pipe(Schema.check(Schema.isMinLength(32)));
const RedactedSecret = Schema.RedactedFromValue(Secret);
const RedactedDatabaseUrl = Schema.RedactedFromValue(Schema.NonEmptyString);

export interface ServerConfigShape {
  readonly betterAuthSecret: Redacted.Redacted<string>;
  readonly betterAuthUrl: string;
  readonly corsOrigin: string;
  readonly databaseUrl: Redacted.Redacted<string>;
  readonly nodeEnv: typeof Environment.Type;
}

/** Decoded server-only configuration. This service must never enter browser code. */
export class ServerConfig extends Context.Service<
  ServerConfig,
  ServerConfigShape
>()("@party-planner/env/ServerConfig") {}

const serverConfig = Effect.gen(function* loadServerConfig() {
  const betterAuthSecret = yield* Config.schema(
    RedactedSecret,
    "BETTER_AUTH_SECRET"
  );
  const betterAuthUrl = yield* Config.schema(Url, "BETTER_AUTH_URL");
  const corsOrigin = yield* Config.schema(Url, "CORS_ORIGIN");
  const databaseUrl = yield* Config.schema(RedactedDatabaseUrl, "DATABASE_URL");
  const nodeEnv = yield* Config.schema(Environment, "NODE_ENV").pipe(
    Config.withDefault("development")
  );

  return ServerConfig.of({
    betterAuthSecret,
    betterAuthUrl,
    corsOrigin,
    databaseUrl,
    nodeEnv,
  });
});

/** Reads and validates server configuration from the active ConfigProvider. */
export const serverConfigLayer = Layer.effect(ServerConfig, serverConfig);
