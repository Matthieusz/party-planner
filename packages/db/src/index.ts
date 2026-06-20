import { env } from "@party-planner/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

export const createDb = () => drizzle(env.DATABASE_URL);

export const db = createDb();
