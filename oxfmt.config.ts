import { defineConfig } from "oxfmt";

/** Formatting policy for project-owned files. */
export default defineConfig({
  useTabs: false,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  ignorePatterns: [
    "node_modules/**",
    "repos/**",
    "frontend/dist/**",
    ".alchemy/**",
    ".codegraph/**",
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".codex/**",
    ".continue/**",
    ".cursor/**",
    ".gemini/**",
    ".opencode/**",
    ".pi/**",
    ".roo/**",
    ".windsurf/**",
    "tools/oxlint/anti-slop/**",
  ],
});
