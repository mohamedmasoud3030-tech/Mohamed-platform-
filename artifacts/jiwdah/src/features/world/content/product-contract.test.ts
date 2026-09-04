import { describe, expect, it } from "vitest";
import { findSystem, publicSystems } from "@/content/systems";
import { evidenceFor } from "./evidence";
import { productConnectionFor } from "./product-connections";
import { findWorldEntity } from "./world";
import { productContractFor } from "./product-contract";

describe("ProductContractV1", () => {
  it("derives MALEK from the canonical authorities without copying product truth", () => {
    const contract = productContractFor("property");
    expect(contract).toBeDefined();
    expect(contract?.systemId).toBe("property");
    expect(contract?.system).toBe(findSystem("property"));
    expect(contract?.world).toEqual({
      state: findWorldEntity("property")?.state,
      dna: findWorldEntity("property")?.dna,
      detailPath: "/world/property",
    });
    expect(contract?.evidence).toBe(evidenceFor("property"));
    expect(contract?.connection).toBe(productConnectionFor("property"));
    expect(contract?.connection?.productUrl).toBe("https://malek-plus.vercel.app/");
    expect(contract?.handoff).toEqual({
      href: "https://malek-plus.vercel.app/",
      kind: "external-product",
      opensIn: "new-tab",
      authOwner: "product",
      dataSharing: "none",
    });
    expect(contract?.observation).toEqual({
      availability: "unavailable",
      reason: "no-authorized-product-source",
      observedAt: null,
      writable: false,
    });
  });

  it("keeps unconnected public products truthful and unavailable", () => {
    for (const system of publicSystems().filter((entry) => entry.id !== "property")) {
      const contract = productContractFor(system.id);
      expect(contract).toBeDefined();
      expect(contract?.system).toBe(system);
      expect(contract?.evidence).toEqual(evidenceFor(system.id) ?? []);
      expect(contract?.connection).toBeNull();
      expect(contract?.handoff).toBeNull();
      expect(contract?.observation.availability).toBe("unavailable");
      expect(contract?.observation.reason).toBe("no-authorized-product-source");
    }
  });

  it("does not create public contracts for hidden or unknown systems", () => {
    expect(productContractFor("materials")).toBeUndefined();
    expect(productContractFor("not-a-system")).toBeUndefined();
  });
});
