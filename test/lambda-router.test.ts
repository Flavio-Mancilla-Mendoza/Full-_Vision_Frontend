import { describe, it, expect } from "vitest";
import { routeRequest } from "../packages/lambda-proxy/lib/router.js";

describe("supabase-proxy router basic behavior", () => {
  it("returns 404 for unknown route when authenticated", async () => {
    const normalized = { method: "GET", path: "/unknown/route", pathParameters: {}, body: null };
    const deps = {
      supabase: {},
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      validateAndCalculateOrderItems: () => {},
      generatePresignedUploadUrl: () => {},
      logger: { debug: () => {}, info: () => {}, error: () => {} },
      isAdminUser: () => false,
    };

    const res = await routeRequest(normalized, { email: "a@x.com" }, deps);
    expect(res.statusCode).toBe(404);
  });

  it("returns 401 for protected routes when no user", async () => {
    const normalized = { method: "GET", path: "/orders", pathParameters: {}, body: null };
    const deps = {
      supabase: {},
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      validateAndCalculateOrderItems: () => {},
      generatePresignedUploadUrl: () => {},
      logger: { debug: () => {}, info: () => {}, error: () => {} },
      isAdminUser: () => false,
    };

    const res = await routeRequest(normalized, null, deps);
    expect(res.statusCode).toBe(401);
  });
});
