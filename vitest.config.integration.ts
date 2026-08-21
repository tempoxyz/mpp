import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    hookTimeout: 150_000,
    include: ["integration/**/*.test.ts"],
    testTimeout: 60_000,
  },
});
