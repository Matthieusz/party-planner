import { todo } from "@party-planner/db/schema/todo";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import z from "zod";

import { protectedProcedure } from "../index";

export const todoRouter = {
  create: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .handler(
      async ({ context, input }) =>
        await Effect.runPromise(
          context.database.insert(todo).values({ text: input.text })
        )
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(
      async ({ context, input }) =>
        await Effect.runPromise(
          context.database.delete(todo).where(eq(todo.id, input.id))
        )
    ),

  getAll: protectedProcedure.handler(
    async ({ context }) =>
      await Effect.runPromise(context.database.select().from(todo))
  ),

  toggle: protectedProcedure
    .input(z.object({ completed: z.boolean(), id: z.number() }))
    .handler(
      async ({ context, input }) =>
        await Effect.runPromise(
          context.database
            .update(todo)
            .set({ completed: input.completed })
            .where(eq(todo.id, input.id))
        )
    ),
};
