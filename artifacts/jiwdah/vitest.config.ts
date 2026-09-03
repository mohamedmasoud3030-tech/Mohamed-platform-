import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Standalone test configuration — intentionally decoupled from vite.config.ts
 * (which carries deployment-specific plugins). The spatial subsystem under
 * test is pure logic plus jsdom-rendered page contracts.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/spatialSetup.ts"],
  },
});
