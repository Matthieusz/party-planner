import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps truthy classes and removes falsey classes", () => {
    const includeClass = false;
    const className = cn("a", includeClass && "b", "a");

    expect(className.split(" ")).toContain("a");
    expect(className.split(" ")).not.toContain("b");
  });
});
