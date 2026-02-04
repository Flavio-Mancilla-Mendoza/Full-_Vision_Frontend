import { describe, it, expect } from "vitest";
import { generateSlug, generateSKU } from "@/lib/product-utils";

describe("product-utils", () => {
  it("generates a slug from name", () => {
    expect(generateSlug("Hola Mundo!")).toBe("hola-mundo");
  });

  it("generates an SKU with prefix", () => {
    const sku = generateSKU("Rabanera", "Aviador", "M");
    expect(sku.startsWith("FV-")).toBe(true);
    expect(sku.split("-").length).toBeGreaterThanOrEqual(4);
  });
});
