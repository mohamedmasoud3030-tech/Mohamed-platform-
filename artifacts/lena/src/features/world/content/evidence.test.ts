import { describe, expect, it } from "vitest";
import { evidenceFor, SYSTEM_EVIDENCE } from "./evidence";

describe("product evidence authority", () => {
  it("uses the evidence registry itself as the publication truth", () => {
    expect(evidenceFor("property")).toBe(SYSTEM_EVIDENCE.property);
    expect(evidenceFor("wellness")).toBeUndefined();
    expect(evidenceFor("rental")).toBeUndefined();
  });

  it("has substantive real MALEK operating evidence", () => {
    const malek = evidenceFor("property") ?? [];
    expect(malek.length).toBeGreaterThanOrEqual(7);
    expect(malek.map((surface) => surface.id)).toEqual(
      expect.arrayContaining([
        "entry",
        "dashboard",
        "properties",
        "contracts",
        "financials",
        "maintenance",
        "mobile",
      ]),
    );
  });

  it("keeps evidence ids and asset paths unique", () => {
    for (const surfaces of Object.values(SYSTEM_EVIDENCE)) {
      if (!surfaces) continue;
      const ids = surfaces.map((surface) => surface.id);
      const paths = surfaces.map((surface) => surface.src);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });
});
