import { describe, it, expect } from "vitest";
import handleProducts from "../packages/lambda-proxy/handlers/products.js";
import { mockProductsWithSku } from "./utils/supabase-mocks";

describe("handlers/products", () => {
  it("returns upload-url for admin", async () => {
    const deps = {
      supabase: {},
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      isAdminUser: (u) => u && u.groups && u.groups.includes("admins"),
      generatePresignedUploadUrl: async (fileName, contentType) => ({ uploadUrl: "https://signed", s3Key: "k", fileName }),
      logger: { info: () => {}, error: () => {} },
    };

    const res = await handleProducts({
      method: "POST",
      pathParameters: { id: "upload-url" },
      body: { fileName: "a.png", contentType: "image/png" },
      user: { groups: ["admins"] },
      ...deps,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.uploadUrl).toBe("https://signed");
  });

  it("forbids upload-url for non-admin", async () => {
    const deps = {
      supabase: {},
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      isAdminUser: () => false,
      generatePresignedUploadUrl: async () => ({}),
      logger: { info: () => {}, error: () => {} },
    };

    const res = await handleProducts({
      method: "POST",
      pathParameters: { id: "upload-url" },
      body: { fileName: "a.png", contentType: "image/png" },
      user: { groups: ["users"] },
      ...deps,
    });
    expect(res.statusCode).toBe(403);
  });

  it("check-sku returns exists true when supabase returns data", async () => {
    const supabase = mockProductsWithSku(true);

    const res = await handleProducts({
      method: "POST",
      pathParameters: { id: "check-sku" },
      body: { sku: "X" },
      user: {},
      supabase,
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      isAdminUser: () => false,
      generatePresignedUploadUrl: async () => ({}),
      logger: { error: () => {} },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.exists).toBe(true);
  });
});
