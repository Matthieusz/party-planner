import foldkitLint from "@foldkit/oxlint-plugin";
import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      "dev:server": {
        command: "vp run build:web && alchemy dev",
        cache: false,
      },
      "dev:web": {
        command: "vp dev",
        cache: false,
      },
      dev: {
        // Vite Task requires a command even for a group of long-running dependencies.
        command: "true",
        dependsOn: ["dev:server", "dev:web"],
        cache: false,
      },
      "build:web": {
        command: "vp build",
        cache: false,
      },
      typecheck: {
        command: "effect-tsgo tsrs --noEmit",
        cache: false,
      },
      lint: {
        command: "effect-tsgo --tsrs-lint vp lint --disable-nested-config",
        cache: false,
      },
      "lint:fix": {
        command: "effect-tsgo --tsrs-lint vp lint --disable-nested-config --fix",
        cache: false,
      },
      format: {
        command: "vp fmt --write .",
        cache: false,
      },
      "format:check": {
        command: "vp fmt --check .",
        cache: false,
      },
      check: {
        command: "effect-tsgo --tsrs-lint vp check && vp run typecheck",
        cache: false,
      },
      fix: {
        command: "effect-tsgo --tsrs-lint vp check --fix && vp run typecheck",
        cache: false,
      },
      build: {
        command: "vp run typecheck && vp run build:web",
        cache: false,
      },
      test: {
        command: "bun test ./test/unit",
        cache: false,
      },
      "test:integration": {
        command: "bun test ./test/integration",
        cache: false,
      },
      deploy: {
        command: "vp run build && alchemy deploy --stage production",
        cache: false,
      },
    },
  },
  root: fileURLToPath(new URL("./frontend", import.meta.url)),
  fmt: {
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
  },
  lint: {
    ...foldkitLint.configs.recommended,
    options: { typeAware: true, typeCheck: true },
    plugins: ["typescript", "oxc"],
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
    jsPlugins: [
      ...foldkitLint.configs.recommended.jsPlugins,
      { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
      { name: "anti-slop-effect", specifier: "./tools/oxlint/anti-slop/effect/index.ts" },
    ],
    rules: {
      ...foldkitLint.configs.recommended.rules,
      "typescript/no-explicit-any": "error",
      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
      "anti-slop-effect/no-service-constructor-imports": "error",
    },
  },
  plugins: [foldkit(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./frontend/src", import.meta.url)) },
  },
  server: {
    port: 1337,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:1339", changeOrigin: false } },
  },
  optimizeDeps: { entries: ["src/entry.ts"] },
});
