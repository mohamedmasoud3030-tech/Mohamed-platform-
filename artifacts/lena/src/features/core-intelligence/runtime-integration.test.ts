import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("LENA Intelligence runtime activation contract", () => {
  it("has one canonical React intelligence seam wired to every canonical runtime", () => {
    const hook = read("src/features/core-intelligence/useLenaIntelligence.ts");

    expect(hook).toContain("deriveLenaIntelligence");
    expect(hook).toContain("useSpatialContext");
    expect(hook).toContain("useWorldMemory");
    expect(hook).toContain("useSignalRuntime");
    expect(hook).toContain("worldRegistry");
    expect(hook).toContain("WORLD_ENTITIES");
    expect(hook).toContain("canonicalWorldGraphAdapter");
  });

  it("binds the Sacred Core surface to the canonical intelligence result", () => {
    const scene = read("src/features/world/components/WorldScene.tsx");

    expect(scene).toContain("useLenaIntelligence");
    expect(scene).toContain("data-core-state={core.state}");
    expect(scene).toContain("data-core-pulse={core.pulse}");
    expect(scene).toContain("data-core-attention={core.attentionLevel}");
    expect(scene).toContain("className={`lena-world-core core-${core.state} urgency-${core.urgency}`}");
    expect(scene).toContain("data-guidance-world={guidance.destination?.systemId ?? undefined}");
    const worldStyles = read("src/styles/world-v2.css");
    const coreStyles = read("src/styles/sacred-core.css");
    expect(coreStyles).toContain(".lena-world-core.core-focused");
    expect(coreStyles).toContain(".lena-world-core.core-critical");
    expect(worldStyles).toContain(".lena-world-v2.is-focus .lena-world-path.presence-unavailable.is-active::after");
  });

  it("passes source authority into the intelligence snapshot", () => {
    const hook = read("src/features/core-intelligence/useLenaIntelligence.ts");
    const runtime = read("src/features/world/signals/runtime.ts");
    const provider = read("src/features/world/signals/SignalRuntimeProvider.tsx");
    const barrel = read("src/features/world/signals/index.ts");

    expect(hook).toContain("signalSource: source");
    expect(runtime).toContain("seed: WorldSignal[] = []");
    expect(runtime).not.toContain("DEMO_SIGNALS");
    expect(runtime).toContain("getSource");
    expect(provider).toContain("unavailablePresence");
    expect(provider).toContain("source.availability");
    expect(barrel).not.toContain("export * from \"./fixtures.ts\"");
  });

  it("keeps intelligence read-only at the presentation seam", () => {
    const hook = read("src/features/core-intelligence/useLenaIntelligence.ts");

    expect(hook).not.toMatch(/acknowledge\s*\(/);
    expect(hook).not.toMatch(/resolve\s*\(/);
    expect(hook).not.toMatch(/navigate\s*\(/);
    expect(hook).not.toMatch(/worldMemory\.remember/);
  });

  it("treats CanonicalWorldGraphAdapter as the live graph seam, not a future landing", () => {
    const readme = read("src/features/core-intelligence/README.md");
    const adapter = read("src/features/core-intelligence/graph/GraphContextAdapter.ts");
    const canonical = read("src/features/core-intelligence/graph/CanonicalWorldGraphAdapter.ts");

    expect(readme).toContain("CanonicalWorldGraphAdapter");
    expect(readme).toContain("@/graph");
    expect(readme).not.toContain("When the real World Graph lands");
    expect(adapter).not.toContain("later integration connects the real World Graph");
    expect(adapter).not.toContain("future integration seam tomorrow");
    expect(canonical).toContain('from "@/graph"');
  });

  it("World Command reads source authority from intelligence and mutates only through the signal adapter", () => {
    const cmd = read("src/features/world/command/WorldCommand.tsx");

    expect(cmd).toContain("useLenaIntelligence");
    expect(cmd).toContain("context.signals.source");
    expect(cmd).toContain("useSignalRuntime");
    expect(cmd).toMatch(/acknowledge\(signal\.id\)/);
    expect(cmd).not.toContain("DEMO_SIGNALS");
    expect(cmd).not.toContain("publicProjects");
    expect(cmd).not.toMatch(/worldMemory\.remember/);
  });
});
