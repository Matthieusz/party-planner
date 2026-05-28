import { defineProject, mergeConfig } from "vitest/config";

import configShared from "../../vitest.shared";

export default mergeConfig(
  configShared,
  defineProject({
    resolve: {
      alias: {
        "@": "./src",
        "@party-planner/ui": "../../packages/ui/src",
      },
    },
    test: {
      environment: "jsdom",
      name: "web",
      setupFiles: ["./src/test-setup.ts"],
    },
  })
);
