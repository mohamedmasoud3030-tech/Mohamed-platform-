import { describe, expect, it } from "vitest";
import {
  PRODUCT_CONNECTIONS,
  productConnectionFor,
} from "./product-connections";

describe("LENA product connection contract", () => {
  it("connects the MALEK World to its verified production destination", () => {
    expect(productConnectionFor("property")).toEqual({
      systemId: "property",
      productUrl: "https://malek-plus.vercel.app/",
    });
  });

  it("does not invent destinations for products that are not connected yet", () => {
    expect(productConnectionFor("wellness")).toBeUndefined();
    expect(productConnectionFor("rental")).toBeUndefined();
    expect(productConnectionFor("investment")).toBeUndefined();
    expect(productConnectionFor("hospitality")).toBeUndefined();
    expect(productConnectionFor("recycling")).toBeUndefined();
  });

  it("keeps connections unique and HTTPS-only", () => {
    const ids = PRODUCT_CONNECTIONS.map((connection) => connection.systemId);
    expect(new Set(ids).size).toBe(ids.length);

    for (const connection of PRODUCT_CONNECTIONS) {
      expect(new URL(connection.productUrl).protocol).toBe("https:");
    }
  });
});
