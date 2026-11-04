import foldkitLint from "@foldkit/oxlint-plugin";
import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const browserImportFence = [
  {
    regex: "(^|/)backend(/|$)",
    message: "Browser modules must use shared contracts, not backend runtime modules.",
  },
  {
    regex: "^(@alchemy\\.run/|alchemy(/|$)|@effect/platform-node(/|$)|cloudflare:|node:)",
    message: "Server runtime dependencies do not belong in browser modules.",
  },
];

const orchestrationImportFence = [
  {
    regex: "(^|/)(adapters|providers)(/|$)|(^|/)(database|http|provider)(\\.[^/]+)?$",
    message:
      "Orchestration depends on application-owned interfaces; wire adapters at composition roots.",
  },
  {
    regex:
      "^(@alchemy\\.run/|alchemy(/|$)|better-auth(/|$)|kysely(/|$)|@effect/(platform|sql)|effect/(http|http-api|sql)(/|$)|cloudflare:|node:)",
    message: "Orchestration must not depend directly on vendor adapters.",
  },
];

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
        command: "vp test run test/unit",
        cache: false,
      },
      "test:integration": {
        command: "vp test run test/integration",
        cache: false,
      },
      deploy: {
        command: "vp run build && alchemy deploy --stage production",
        cache: false,
      },
    },
  },
  root: fileURLToPath(new URL("./frontend", import.meta.url)),
  test: {
    root: fileURLToPath(new URL(".", import.meta.url)),
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
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
    overrides: [
      {
        files: ["shared/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  regex: "(^|/)(backend|frontend)(/|$)|^@/",
                  message: "Shared domain modules must not depend on either runtime.",
                },
                {
                  regex:
                    "^(effect/(http|http-api|sql|unstable)(/|$)|@effect/(platform|sql)|@alchemy\\.run/|alchemy(/|$)|better-auth(/|$)|kysely(/|$)|cloudflare:|node:)|(^|/)(adapters|providers|http|database|provider)(/|\\.|$)",
                  message: "Keep HTTP, database, and provider code out of pure domain modules.",
                },
              ],
            },
          ],
        },
      },
      {
        files: ["frontend/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: browserImportFence,
            },
          ],
        },
      },
      {
        files: ["frontend/src/app/**", "frontend/src/**/commands.ts"],
        rules: {
          // Overrides replace rule options: retain the browser fence here too.
          "no-restricted-imports": [
            "error",
            {
              patterns: [...browserImportFence, ...orchestrationImportFence],
            },
          ],
        },
      },
      {
        files: [
          "backend/**/application.ts",
          "backend/**/application/**",
          "backend/**/workflow.ts",
          "backend/**/workflows/**",
        ],
        rules: {
          "no-restricted-imports": ["error", { patterns: orchestrationImportFence }],
        },
      },
      {
        files: ["test/**/*.test.ts"],
        rules: {
          // Tests construct messages as inputs and expected results, not as parent modules.
          "foldkit/no-child-message-construction-in-root": "off",
        },
      },
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
