import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    clearMocks: true,
    sequence: { shuffle: false },
    env: {
      SUEOPRO_DATA_MODE: "fixture",
      SUEOPRO_DATABASE_PATH: ":memory:",
      TZ: "Asia/Seoul",
    },
  },
});
