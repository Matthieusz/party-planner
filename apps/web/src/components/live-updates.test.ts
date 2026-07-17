import { Option } from "effect";
import { describe, expect, it } from "vitest";

import { parseLiveEventData } from "./live-updates";

describe("parseLiveEventData", () => {
  it("accepts an operational live event", () => {
    const event = parseLiveEventData(
      JSON.stringify({
        resource: "function",
        resourceId: "function-a",
        venueId: "venue-a",
      })
    );

    expect(Option.isSome(event)).toBe(true);
  });

  it("rejects malformed and unsupported events", () => {
    expect(Option.isNone(parseLiveEventData("not-json"))).toBe(true);
    expect(
      Option.isNone(
        parseLiveEventData(
          JSON.stringify({
            resource: "client",
            resourceId: "client-a",
            venueId: "venue-a",
          })
        )
      )
    ).toBe(true);
  });
});
