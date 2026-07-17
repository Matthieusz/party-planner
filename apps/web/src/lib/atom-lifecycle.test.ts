import { Effect, Layer, Schema } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import * as Hydration from "effect/unstable/reactivity/Hydration";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
});

describe("Atom frontend lifecycle", () => {
  it("keeps a query warm during its idle TTL and cleans it up afterward", () => {
    vi.useFakeTimers();
    let requests = 0;
    const query = Atom.make(
      Effect.sync(() => {
        requests += 1;
        return "sessions";
      })
    ).pipe(Atom.setIdleTTL("30 seconds"));
    const registry = AtomRegistry.make({ timeoutResolution: 1 });

    const unmount = registry.mount(query);
    expect(AsyncResult.isSuccess(registry.get(query))).toBe(true);
    expect(requests).toBe(1);
    unmount();
    vi.advanceTimersByTime(20_000);

    const remount = registry.mount(query);
    expect(requests).toBe(1);
    remount();
    vi.advanceTimersByTime(30_001);

    expect(registry.getNodes().size).toBe(0);
    registry.dispose();
  });

  it("interrupts the previous write when a mutation is repeated", () => {
    let interruptions = 0;
    const completions: ((value: string) => void)[] = [];
    const mutation = Atom.fn((value: string) =>
      Effect.callback<string>((resume) => {
        completions.push((result) => resume(Effect.succeed(result)));
        return Effect.sync(() => {
          interruptions += 1;
        });
      }).pipe(Effect.as(value))
    );
    const registry = AtomRegistry.make();
    const unmount = registry.mount(mutation);

    registry.set(mutation, "first");
    registry.set(mutation, "second");
    expect(interruptions).toBe(1);

    completions[1]?.("second");
    const result = registry.get(mutation);
    expect(result._tag).toBe("Success");
    if (result._tag === "Success") {
      expect(result.value).toBe("second");
    }

    unmount();
    registry.dispose();
  });

  it("refetches a query after a matching mutation invalidates its key", () => {
    let requests = 0;
    const key = ["venue", "venue-a", "sessions"] as const;
    const runtime = Atom.runtime(Layer.empty);
    const query = runtime
      .atom(
        Effect.sync(() => {
          requests += 1;
          return requests;
        })
      )
      .pipe(runtime.factory.withReactivity(key));
    const mutation = runtime.fn(() => Effect.void, { reactivityKeys: key });
    const registry = AtomRegistry.make();
    const unmountQuery = registry.mount(query);
    const unmountMutation = registry.mount(mutation);

    expect(registry.get(query)._tag).toBe("Success");
    expect(requests).toBe(1);
    registry.set(mutation, undefined);
    expect(requests).toBe(2);

    unmountMutation();
    unmountQuery();
    registry.dispose();
  });

  it("hydrates isolated registries without sharing state", () => {
    const identityAtom = Atom.make("anonymous").pipe(
      Atom.serializable({ key: "identity", schema: Schema.String })
    );
    const serverA = AtomRegistry.make();
    const serverB = AtomRegistry.make();
    serverA.set(identityAtom, "staff-a");
    serverB.set(identityAtom, "staff-b");

    const browserA = AtomRegistry.make();
    const browserB = AtomRegistry.make();
    Hydration.hydrate(browserA, Hydration.dehydrate(serverA));
    Hydration.hydrate(browserB, Hydration.dehydrate(serverB));

    expect(browserA.get(identityAtom)).toBe("staff-a");
    expect(browserB.get(identityAtom)).toBe("staff-b");
    browserA.set(identityAtom, "changed-a");
    expect(browserB.get(identityAtom)).toBe("staff-b");

    for (const registry of [serverA, serverB, browserA, browserB]) {
      registry.dispose();
    }
  });
});
