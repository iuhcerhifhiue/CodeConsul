import { defineConfig } from "vitest/config";

// Pin config resolution here so this server's tests never climb up into the
// parent CodeConsul frontend's vite.config.js (and its Base44 plugin). Keeps the
// verify-server genuinely self-contained.
export default defineConfig({
  test: {
    root: ".",
    include: ["test/**/*.test.ts"],
  },
});
