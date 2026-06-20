import { defineProject } from "vitest/config";

import sharedConfig from "../../vitest.shared";

export default defineProject({
  ...sharedConfig,
  test: {
    ...sharedConfig.test,
    name: "fumadocs",
  },
});
