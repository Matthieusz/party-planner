// @effect-diagnostics unstableApiUsage:off
// Persisted rate-limit keys intentionally use Effect SHA-256 digests.
import { Password } from "@yielded/auth";
import { Effect, Layer, Schema } from "effect";
import { Digest } from "effect/crypto";
import { Database } from "./database.ts";

/** D1 token buckets survive Worker request scopes; each atomic statement consumes without refunds. */
export const PasswordLimitsLive = Layer.effect(
  Password.PasswordAttemptLimiter,
  Effect.gen(function* () {
    // Native D1 batches are atomic; interactive Drizzle transactions are not supported by D1.
    const database = yield* Database;
    const sql = database.$client;
    const crypto = yield* Digest.Digest;
    return Password.PasswordAttemptLimiter.of({
      check: Effect.fn("PasswordLimits.check")(function* (input) {
        const budget = yield* Schema.decodeEffect(Password.PasswordAttemptPolicy.fields.identifier)(
          input.budget,
        ).pipe(Effect.mapError(() => Password.PasswordUnavailable.make({})));
        const digest = yield* crypto
          .digest(
            Digest.sha256,
            new TextEncoder().encode(
              JSON.stringify([input.moduleId, input.action, input.scope, input.key]),
            ),
          )
          .pipe(Effect.mapError(() => Password.PasswordUnavailable.make({})));
        const key = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
        // A day is the largest supported refill window. Cleanup never evicts an active bucket.
        const cleanup = sql`delete from auth_rate_limits where updatedAt < cast(unixepoch('subsec') * 1000 as integer) - 86400000`;
        const charge = sql`insert into auth_rate_limits (key, tokens, updatedAt)
        select ${key}, ${budget.limit - 1}, cast(unixepoch('subsec') * 1000 as integer)
        where (select count(*) from auth_rate_limits) < 10000
          or exists(select 1 from auth_rate_limits where key = ${key})
        on conflict(key) do update set
          tokens = min(${budget.limit}, auth_rate_limits.tokens + max(0, cast(unixepoch('subsec') * 1000 as integer) - auth_rate_limits.updatedAt) * ${budget.limit} * 1.0 / ${budget.windowMillis}) - 1,
          updatedAt = cast(unixepoch('subsec') * 1000 as integer)
        where min(${budget.limit}, auth_rate_limits.tokens + max(0, cast(unixepoch('subsec') * 1000 as integer) - auth_rate_limits.updatedAt) * ${budget.limit} * 1.0 / ${budget.windowMillis}) >= 1
        returning key`;
        const results = yield* sql
          .batch([cleanup, charge])
          .pipe(Effect.mapError(() => Password.PasswordUnavailable.make({})));
        const charged = yield* Schema.decodeUnknownEffect(
          Schema.Array(Schema.Struct({ key: Schema.String })),
        )(results[1]).pipe(Effect.mapError(() => Password.PasswordUnavailable.make({})));
        if (charged.length === 0) return yield* Password.PasswordRejected.make({});
      }),
    });
  }),
);
