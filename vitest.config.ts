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
      SUPRO_DATA_MODE: "fixture",
      SUPRO_DATABASE_PATH: ":memory:",
      TZ: "Asia/Seoul",
    },
  },
});
