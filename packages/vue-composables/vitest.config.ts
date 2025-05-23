import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globalSetup: `test/support/global-setup.ts`,
    setupFiles: [],
    environment: "jsdom",
    typecheck: { enabled: true },
  },
})
