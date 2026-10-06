import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Schema-tooling entry point. Keep application tables and Yielded tables in the same migration history.
export {
  subjects,
  identifiers,
  credentials,
  passwords,
  attempts,
  commands,
  registrations,
  sessions,
  flows,
} from "./auth-tables.ts";

/** Durable password token buckets; the database rejects negative balances. */
export const rateLimits = sqliteTable(
  "auth_rate_limits",
  {
    key: text().primaryKey(),
    tokens: real().notNull(),
    updatedAt: integer().notNull(),
  },
  (table) => [check("auth_rate_limits_tokens_nonnegative", sql`${table.tokens} >= 0`)],
);
