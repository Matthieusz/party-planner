import { describe, expect, it, vi } from "vitest";

import { markdownPathToSlugs, slugsToMarkdownPath } from "./source";

vi.mock("collections/server", () => ({
  docs: {
    toFumadocsSource: () => ({ files: [] }),
  },
}));

vi.mock("fumadocs-core/source", () => ({
  loader: (input: unknown) => input,
}));

vi.mock("fumadocs-core/source/lucide-icons", () => ({
  lucideIconsPlugin: () => ({}),
}));

describe("markdownPathToSlugs", () => {
  it("returns empty slugs for an empty path", () => {
    expect(markdownPathToSlugs([])).toEqual([]);
  });

  it("returns empty slugs for the index page", () => {
    expect(markdownPathToSlugs(["index.md"])).toEqual([]);
  });

  it("removes the markdown extension from the final segment", () => {
    expect(markdownPathToSlugs(["guide", "intro.md"])).toEqual([
      "guide",
      "intro",
    ]);
  });
});

describe("slugsToMarkdownPath", () => {
  it("maps empty slugs to the docs index file", () => {
    expect(slugsToMarkdownPath([]).url.endsWith("/docs/index.md")).toBe(true);
  });
});
