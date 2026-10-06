import { defineConfig } from "drizzle-kit";

/** Generate SQLite SQL/snapshots only; Alchemy applies migrations to local or deployed D1. */
export default defineConfig({
  dialect: "sqlite",
  schema: "./backend/schema.ts",
  // Nested output keeps Alchemy in recursive flat-file mode, preserving the original migration IDs.
  out: "./backend/migrations/drizzle",
});
