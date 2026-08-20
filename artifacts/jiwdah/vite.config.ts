import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "node:child_process";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const resolvedPort = Number.isNaN(port) || port <= 0 ? 3000 : port;

const basePath = process.env.BASE_PATH ?? "/";

/**
 * Build identity, used by the in-app error reference and the support report.
 * Contains no secrets: a short commit id and the build date only.
 */
function resolveBuildId(): string {
  const fromHost = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA;
  if (fromHost) return fromHost.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const appBuild = `${resolveBuildId()}.${new Date().toISOString().slice(0, 10)}`;

export default defineConfig({
  base: basePath,
  define: {
    __APP_BUILD__: JSON.stringify(appBuild),
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: resolvedPort,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    // Development only: the browser calls relative /api paths, so the dev server
    // forwards them to the local API instead of returning the SPA shell.
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
        changeOrigin: false,
      },
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port: resolvedPort,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
