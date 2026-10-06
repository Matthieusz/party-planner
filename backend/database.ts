import type { D1Database } from "@cloudflare/workers-types";
import * as D1Client from "@effect/sql-d1/D1Client";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "drizzle-orm/effect-d1";
import { Context, Effect, Layer } from "effect";

/** Shared application/auth D1 resource; its stable ID preserves existing data and migration history. */
export const AuthDb = Cloudflare.D1.Database("YieldedAuthDb", {
  migrations: "./backend/migrations",
});

/** Request-scoped Drizzle adapter used by application repositories and Yielded persistence. */
export class Database extends Context.Service<
  Database,
  Drizzle.EffectSQLiteD1Database & { readonly $client: D1Client.D1Client }
>()("VenueOperations/Database") {}

/** Resolve the Worker binding and construct one Drizzle instance inside the current request scope. */
export const databaseLive = <R>(binding: Effect.Effect<D1Database, never, R>) =>
  Layer.effect(Database, Drizzle.makeWithDefaults({})).pipe(
    Layer.provide(Layer.unwrap(Effect.map(binding, (db) => D1Client.layer({ db })))),
  );
