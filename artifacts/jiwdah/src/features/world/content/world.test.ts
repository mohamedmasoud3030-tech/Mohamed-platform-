import { describe, expect, it } from "vitest";
import { publicSystems } from "@/content/systems";
import { WORLD_ENTITIES, worldPathFor } from "./world";

describe("LENA World canonical system contract", () => {
  it("derives public membership and order from the canonical systems registry", () => {
    expect(WORLD_ENTITIES.map((entity) => entity.systemId)).toEqual(
      publicSystems().map((system) => system.id),
    );
  });

  it("derives every chamber route from the stable canonical system id", () => {
    for (const entity of WORLD_ENTITIES) {
      expect(entity.detailPath).toBe(worldPathFor(entity.systemId));
      expect(entity.detailPath).toBe(`/world/${entity.systemId}`);
    }
  });

  it("contains no duplicate system ids or chamber routes", () => {
    const systemIds = WORLD_ENTITIES.map((entity) => entity.systemId);
    const routes = WORLD_ENTITIES.map((entity) => entity.detailPath);

    expect(new Set(systemIds).size).toBe(systemIds.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("does not leak hidden systems into the public World", () => {
    expect(WORLD_ENTITIES.some((entity) => entity.systemId === "materials")).toBe(false);
  });
});
