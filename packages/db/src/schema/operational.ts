import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { member, organization } from "./auth";

/** Persisted Function rows; product UI calls these Sessions. */
export const functionTable = pgTable(
  "function",
  {
    endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
    status: text("status").notNull(),
    venueId: text("venue_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("function_venue_id_starts_at_idx").on(table.venueId, table.startsAt),
  ]
);

/** Assignment is the Coordinator authority anchor for a Function. */
export const functionAssignment = pgTable(
  "function_assignment",
  {
    functionId: text("function_id")
      .notNull()
      .references(() => functionTable.id, { onDelete: "cascade" }),
    staffId: text("staff_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    venueId: text("venue_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.venueId, table.functionId, table.staffId] }),
    index("function_assignment_venue_staff_idx").on(
      table.venueId,
      table.staffId
    ),
  ]
);
