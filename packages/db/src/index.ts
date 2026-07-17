import { PgClient } from "@effect/sql-pg";
import { ServerConfig } from "@party-planner/env/server";
import { makeWithDefaults } from "drizzle-orm/effect-postgres";
import { Context, Effect, Layer } from "effect";
import type { Success } from "effect/Effect";

export type DatabaseShape = Success<ReturnType<typeof makeWithDefaults>>;

/** Effect-native Drizzle database used by application repositories. */
export class Database extends Context.Service<Database, DatabaseShape>()(
  "@party-planner/db/Database"
) {}

const databaseLayer = Layer.effect(Database, makeWithDefaults());

/** Scoped PostgreSQL pool and Effect-native Drizzle acquisition. */
export const liveDatabaseLayer = Layer.unwrap(
  Effect.gen(function* makeLiveDatabaseLayer() {
    const config = yield* ServerConfig;
    const postgresLayer = PgClient.layer({
      applicationName: "party-planner",
      url: config.databaseUrl,
    });
    return databaseLayer.pipe(Layer.provide(postgresLayer));
  })
);
