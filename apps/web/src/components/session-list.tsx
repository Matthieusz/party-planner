import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import type { Session } from "@party-planner/api/session/domain";
import type { AsyncResult as AsyncResultValue } from "effect/unstable/reactivity/AsyncResult";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { ReactNode } from "react";

import { sessionsAtom } from "../lib/session-atoms";

interface SessionListViewProps {
  readonly onRetry: () => void;
  readonly result: AsyncResultValue<readonly Session[], unknown>;
}

const Sessions = ({ sessions }: { readonly sessions: readonly Session[] }) => {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No upcoming Sessions.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((session) => (
        <li
          className="flex items-center justify-between gap-3"
          key={session.id}
        >
          <span className="text-sm font-medium">{session.name}</span>
          <span className="text-xs capitalize text-muted-foreground">
            {session.status}
          </span>
        </li>
      ))}
    </ul>
  );
};

const PreviousSessions = ({
  result,
}: {
  readonly result: AsyncResultValue<readonly Session[], unknown>;
}) => {
  const sessions = AsyncResult.getOrElse(result, () => []);
  return sessions.length > 0 ? <Sessions sessions={sessions} /> : null;
};

export const SessionListView = ({
  onRetry,
  result,
}: SessionListViewProps): ReactNode => {
  if (result.waiting && result._tag !== "Initial") {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-2">
        <PreviousSessions result={result} />
        <p className="text-xs text-muted-foreground">Refreshing Sessions…</p>
      </div>
    );
  }

  return AsyncResult.builder(result)
    .onInitial(() => (
      <p
        aria-busy="true"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        Loading Sessions…
      </p>
    ))
    .onSuccess((sessions) => <Sessions sessions={sessions} />)
    .onError(() => (
      <div role="alert" className="space-y-3">
        <PreviousSessions result={result} />
        <p className="text-sm text-destructive">
          Sessions could not be loaded.
        </p>
        <button
          className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    ))
    .onInterrupt(() => (
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Session loading was cancelled.
      </p>
    ))
    .onDefect(() => (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">
          An unexpected error occurred.
        </p>
        <button
          className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    ))
    .exhaustive();
};

export const SessionList = () => {
  const result = useAtomValue(sessionsAtom);
  const retry = useAtomRefresh(sessionsAtom);
  return <SessionListView onRetry={retry} result={result} />;
};
