import { useAtomRefresh } from "@effect/atom-react";
import { LiveEvent } from "@party-planner/api/live-event";
import { env } from "@party-planner/env/web";
import { Option, Schema } from "effect";
import { useEffect, useState } from "react";

import { sessionsAtom } from "../lib/session-atoms";

type ConnectionState = "connecting" | "live" | "disconnected";

const MAX_RECONNECTS = 5;
const BASE_RECONNECT_DELAY_MS = 500;

export const parseLiveEventData = (data: string) =>
  Option.flatMap(
    Option.liftThrowable(JSON.parse)(data),
    Schema.decodeUnknownOption(LiveEvent)
  );

/** Owns the authenticated SSE lifecycle and invalidates authoritative Atom reads. */
export const LiveUpdates = () => {
  const refreshSessions = useAtomRefresh(sessionsAtom);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  useEffect(() => {
    let eventSource: EventSource | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnects = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) {
        return;
      }
      setConnectionState("connecting");
      eventSource = new EventSource(`${env.VITE_SERVER_URL}/api/live-events`, {
        withCredentials: true,
      });
      eventSource.addEventListener("open", () => {
        reconnects = 0;
        setConnectionState("live");
      });
      eventSource.addEventListener("invalidate", (message) => {
        const event = parseLiveEventData(
          (message as MessageEvent<string>).data
        );
        if (
          Option.isSome(event) &&
          (event.value.resource === "function" ||
            event.value.resource === "function_assignment")
        ) {
          refreshSessions();
        }
      });
      eventSource.addEventListener("error", () => {
        eventSource?.close();
        if (reconnects >= MAX_RECONNECTS) {
          setConnectionState("disconnected");
          return;
        }
        const jitter = 0.5 + Math.random();
        const delay = BASE_RECONNECT_DELAY_MS * 2 ** reconnects * jitter;
        reconnects += 1;
        reconnectTimer = setTimeout(connect, delay);
      });
    };

    connect();
    return () => {
      disposed = true;
      eventSource?.close();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [refreshSessions]);

  return (
    <span aria-live="polite" className="text-xs text-muted-foreground">
      {connectionState === "live" && "Live updates connected"}
      {connectionState === "connecting" && "Connecting live updates…"}
      {connectionState === "disconnected" &&
        "Live updates unavailable. Refresh to reconnect."}
    </span>
  );
};
