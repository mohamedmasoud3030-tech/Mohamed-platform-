import { builtinEnvironments, type Environment } from "vitest/environments";

/**
 * jsdom on Node 24 installs its own AbortController while Vitest injects
 * Node's Request/fetch. React Router then constructs `new Request(url, {
 * signal })` and undici rejects the foreign AbortSignal:
 *   RequestInit: Expected signal to be an instance of AbortSignal
 *
 * Capture Node's constructors before jsdom setup and put them back so
 * navigation in Command, Atlas, and spatial continuity tests can run.
 */
const jsdom = builtinEnvironments.jsdom;

function restoreNodeAbort(target: Record<string, unknown> | undefined, controller: unknown, signal: unknown) {
  if (!target) return;
  Object.defineProperty(target, "AbortController", {
    configurable: true,
    writable: true,
    value: controller,
  });
  Object.defineProperty(target, "AbortSignal", {
    configurable: true,
    writable: true,
    value: signal,
  });
}

const environment: Environment = {
  name: "jsdom",
  transformMode: "web",
  async setup(global, options) {
    const nodeAbortController = global.AbortController;
    const nodeAbortSignal = global.AbortSignal;
    const result = await jsdom.setup(global, options);
    restoreNodeAbort(global, nodeAbortController, nodeAbortSignal);
    restoreNodeAbort(global.window, nodeAbortController, nodeAbortSignal);
    restoreNodeAbort(globalThis as unknown as Record<string, unknown>, nodeAbortController, nodeAbortSignal);
    return result;
  },
};

export default environment;
