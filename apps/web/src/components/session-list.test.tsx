import { FunctionId, VenueId } from "@party-planner/api/session/domain";
import { fireEvent, render, screen } from "@testing-library/react";
import { Cause, Option } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { describe, expect, it, vi } from "vitest";

import { SessionListView } from "./session-list";

vi.mock("../lib/session-atoms", () => ({ sessionsAtom: {} }));

const session = {
  endsAt: 2,
  id: FunctionId.make("session-a"),
  name: "Dinner service",
  startsAt: 1,
  status: "active" as const,
  venueId: VenueId.make("venue-a"),
};

const renderResult = (
  result: Parameters<typeof SessionListView>[0]["result"],
  onRetry = vi.fn()
) => {
  render(<SessionListView onRetry={onRetry} result={result} />);
  return onRetry;
};

describe("SessionListView", () => {
  it("renders the initial loading state", () => {
    renderResult(AsyncResult.initial(true));

    expect(screen.getByText("Loading Sessions…")).toHaveAttribute(
      "aria-busy",
      "true"
    );
  });

  it("renders successful Sessions", () => {
    renderResult(AsyncResult.success([session]));

    expect(screen.getByText("Dinner service")).toBeVisible();
    expect(screen.getByText("active")).toBeVisible();
  });

  it("keeps previous data visible while refreshing", () => {
    renderResult(AsyncResult.success([session], { waiting: true }));

    expect(screen.getByText("Dinner service")).toBeVisible();
    expect(screen.getByText("Refreshing Sessions…")).toBeVisible();
  });

  it("keeps stale data visible after an expected failure and retries", () => {
    const retry = vi.fn();
    const previousSuccess = AsyncResult.success([session]);
    renderResult(
      AsyncResult.failure(Cause.fail({ _tag: "Session.PersistenceError" }), {
        previousSuccess: Option.some(previousSuccess),
      }),
      retry
    );

    expect(screen.getByText("Dinner service")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sessions could not be loaded."
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders interruption separately from failures", () => {
    renderResult(AsyncResult.failure(Cause.interrupt()));

    expect(screen.getByText("Session loading was cancelled.")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
