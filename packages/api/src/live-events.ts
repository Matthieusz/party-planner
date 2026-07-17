/* eslint-disable max-classes-per-file -- Event schema failure and source service share one adapter module. */
import { ServerConfig } from "@party-planner/env/server";
import {
  Context,
  Effect,
  Layer,
  PubSub,
  Redacted,
  Schema,
  Stream,
} from "effect";
import { Client } from "pg";
import type { Notification } from "pg";

import { LiveEvent } from "./live-event";
import type { LiveEvent as LiveEventValue } from "./live-event";

class LiveListenerError extends Schema.TaggedErrorClass<LiveListenerError>()(
  "LiveEvent.ListenerError",
  { cause: Schema.Defect() }
) {}

export class LiveEventSource extends Context.Service<
  LiveEventSource,
  {
    readonly eventsForVenue: (venueId: string) => Stream.Stream<LiveEventValue>;
  }
>()("@party-planner/api/LiveEventSource") {}

export const liveEventSourceLayer = Layer.effect(
  LiveEventSource,
  Effect.gen(function* makeLiveEventSource() {
    const config = yield* ServerConfig;
    const events = yield* PubSub.unbounded<LiveEventValue>();
    const client = yield* Effect.acquireRelease(
      Effect.tryPromise({
        catch: (cause) => new LiveListenerError({ cause }),
        try: async () => {
          const ownedClient = new Client({
            connectionString: Redacted.value(config.databaseUrl),
          });
          await ownedClient.connect();
          await ownedClient.query("LISTEN party_planner_changes");
          return ownedClient;
        },
      }),
      (ownedClient) => Effect.promise(() => ownedClient.end())
    );

    const services = yield* Effect.context<never>();
    yield* Effect.callback((resume) => {
      const runFork = Effect.runForkWith(services);
      const onNotification = (notification: Notification) => {
        if (!notification.payload) {
          return;
        }
        runFork(
          Effect.try(() => JSON.parse(notification.payload ?? "")).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(LiveEvent)),
            Effect.flatMap((event) => PubSub.publish(events, event)),
            Effect.ignore
          )
        );
      };
      const onError = (cause: Error) => resume(Effect.die(cause));
      client.on("notification", onNotification);
      client.on("error", onError);
      return Effect.sync(() => {
        client.off("notification", onNotification);
        client.off("error", onError);
      });
    }).pipe(Effect.asVoid, Effect.forkScoped);

    return LiveEventSource.of({
      eventsForVenue: (venueId) =>
        Stream.fromPubSub(events).pipe(
          Stream.filter((event) => event.venueId === venueId)
        ),
    });
  })
);
