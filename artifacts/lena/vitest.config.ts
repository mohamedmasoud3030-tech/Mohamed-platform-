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
    // Custom jsdom restores Node AbortController so React Router navigation
    // works on CI Node 24 (jsdom AbortSignal is a different realm).
    environment: "./src/test/jsdom-environment.ts",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/spatialSetup.ts"],
  },
});
