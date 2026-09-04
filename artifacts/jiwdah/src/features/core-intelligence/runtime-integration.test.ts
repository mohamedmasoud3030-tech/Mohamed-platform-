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
    expect(scene).toContain("data-guidance-world={guidance.destination?.systemId ?? undefined}");
  });

  it("keeps intelligence read-only at the presentation seam", () => {
    const hook = read("src/features/core-intelligence/useLenaIntelligence.ts");

    expect(hook).not.toMatch(/acknowledge\s*\(/);
    expect(hook).not.toMatch(/resolve\s*\(/);
    expect(hook).not.toMatch(/navigate\s*\(/);
    expect(hook).not.toMatch(/worldMemory\.remember/);
  });
});
