// @effect-diagnostics unstableApiUsage:off
// Migration tests intentionally use Effect Bun filesystem and path adapters.
import { Database as Sqlite } from "bun:sqlite";
import { expect, test } from "bun:test";
import * as BunFileSystem from "@effect/platform-bun/BunFileSystem";
import * as BunPath from "@effect/platform-bun/BunPath";
import {
  applyAlchemyFormat,
  applyMigrations,
  inlineSqlParams,
  MigrationError,
  readMigrationRecords,
  type SqlExecutor,
} from "@alchemy.run/sql/Migrations";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Effect, Schema } from "effect";
import { rateLimits, subjects } from "../../backend/schema.ts";

const rows = Schema.Array(Schema.Record(Schema.String, Schema.Unknown));

// Run Alchemy's production migration reader/bookkeeping against disposable SQLite.
test.each(["fresh", "existing"] as const)(
  "Drizzle migrations preserve the schema and history of a %s database",
  async (mode) => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const sqlite = yield* Effect.acquireRelease(
          Effect.sync(() => new Sqlite(":memory:")),
          (database) => Effect.sync(() => database.close()),
        );
        sqlite.exec("PRAGMA foreign_keys = ON");
        const executor: SqlExecutor = {
          dialect: "sqlite",
          query: (sql, params = []) =>
            Effect.try({
              try: () => sqlite.query(inlineSqlParams(sql, params, "sqlite")).all(),
              catch: (cause) => new MigrationError({ message: "SQLite query failed", cause }),
            }).pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(rows)),
              Effect.map((decoded) => Array.from(decoded)),
              Effect.mapError((cause) => new MigrationError({ message: "Invalid rows", cause })),
            ),
          batch: (statements) =>
            Effect.try({
              try: () =>
                sqlite.transaction(() => {
                  for (const statement of statements) sqlite.exec(statement);
                })(),
              catch: (cause) => new MigrationError({ message: "SQLite migration failed", cause }),
            }),
        };
        const records = yield* readMigrationRecords("./backend/migrations");
        expect(records.slice(0, 2).map((record) => record.name)).toEqual([
          "0001_yielded_auth.sql",
          "0002_password_limits.sql",
        ]);
        expect(records.some((record) => record.name.startsWith("drizzle/"))).toBe(true);
        const migrate = applyMigrations({
          resolved: { dir: "./backend/migrations", table: "__alchemy_migrations" },
          executor,
        });
        if (mode === "existing") {
          yield* applyAlchemyFormat({
            executor,
            table: "__alchemy_migrations",
            records: records.slice(0, 2),
          });
        } else {
          yield* migrate;
        }
        const database = drizzle({ client: sqlite });
        const identity = {
          id: "migration-test",
          active: 1,
          securityRevision: "revision",
          name: "Local Team Member",
          email: "migration@example.com",
        };
        database.insert(subjects).values(identity).run();
        database.insert(rateLimits).values({ key: "bucket", tokens: 2, updatedAt: 1 }).run();
        yield* migrate;
        yield* migrate;
        expect(database.select().from(subjects).all()).toEqual([identity]);
        expect(database.select().from(rateLimits).all()).toEqual([
          { key: "bucket", tokens: 2, updatedAt: 1 },
        ]);
        expect(() =>
          database.insert(rateLimits).values({ key: "invalid", tokens: -1, updatedAt: 1 }).run(),
        ).toThrow();
        const history = yield* executor.query(
          "SELECT name FROM __alchemy_migrations ORDER BY name",
        );
        expect(history.map((row) => row.name)).toEqual(records.map((record) => record.name).sort());
      }).pipe(Effect.provide([BunFileSystem.layer, BunPath.layer]), Effect.scoped),
    );
  },
);
