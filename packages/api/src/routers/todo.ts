import { db } from "@party-planner/db";
import { todo } from "@party-planner/db/schema/todo";
import { eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure } from "../index";

export const todoRouter = {
  create: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .handler(
      async ({ input }) =>
        await db.insert(todo).values({
          text: input.text,
        })
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(
      async ({ input }) => await db.delete(todo).where(eq(todo.id, input.id))
    ),

  getAll: protectedProcedure.handler(async () => await db.select().from(todo)),

  toggle: protectedProcedure
    .input(z.object({ completed: z.boolean(), id: z.number() }))
    .handler(
      async ({ input }) =>
        await db
          .update(todo)
          .set({ completed: input.completed })
          .where(eq(todo.id, input.id))
    ),
};
