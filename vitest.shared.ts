import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@party-planner/ui/lib/utils": fileURLToPath(
        new URL("packages/ui/src/lib/utils.ts", import.meta.url)
      ),
    },
  },
  test: {
    exclude: ["node_modules", "dist"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
