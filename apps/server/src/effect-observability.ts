import { Effect } from "effect";
import type { RequestLogger } from "evlog";

const failureTag = (failure: unknown): string => {
  if (
    typeof failure === "object" &&
    failure !== null &&
    "_tag" in failure &&
    typeof failure._tag === "string"
  ) {
    return failure._tag;
  }
  return "UnknownFailure";
};

/**
 * Enriches the request's single evlog wide event from an Effect operation.
 * It deliberately does not emit, so the HTTP boundary remains the sole owner
 * of request completion.
 */
export const withRequestObservability = <A, E, R>(
  logger: RequestLogger,
  operation: string,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> => {
  const startedAt = performance.now();
  return effect.pipe(
    Effect.tap(() =>
      Effect.sync(() => {
        logger.set({
          effect: {
            durationMs: performance.now() - startedAt,
            operation,
            outcome: "success",
          },
        });
      })
    ),
    Effect.tapError((failure) =>
      Effect.sync(() => {
        logger.set({
          effect: {
            durationMs: performance.now() - startedAt,
            failureTag: failureTag(failure),
            operation,
            outcome: "failure",
          },
        });
      })
    ),
    Effect.withSpan(operation)
  );
};
