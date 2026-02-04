import { describe, it, expect, vi } from "vitest";
import handleOrders from "../packages/lambda-proxy/handlers/orders.js";

describe("handlers/orders", () => {
  it("creates order and order_items successfully", async () => {
    // Provide global helpers used by handler
    globalThis.validateAndCalculateOrderItems = async (items) => items.map((i) => ({ ...i, unit_price: 10, total_price: 10 * i.quantity }));
    globalThis.calculateOrderTotal = (orderData) => 100;

    const supabase = {
      from: (table) => {
        if (table === "orders") {
          return {
            insert: () => ({ select: () => ({ single: async () => ({ data: { id: "order1" }, error: null }) }) }),
          };
        }
        if (table === "order_items") {
          return { insert: async () => ({ error: null }) };
        }
        return { select: async () => ({ data: null, error: null }) };
      },
    };

    const res = await handleOrders({
      method: "POST",
      pathParameters: {},
      body: { items: [{ product_id: "p1", quantity: 2 }], subtotal: 80, tax_amount: 10, shipping_amount: 5, discount_amount: 0 },
      user: { cognitoId: "u1", email: "a@b.com" },
      supabase,
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      logger: { error: () => {}, debug: () => {} },
    });
    expect(res.statusCode).toBe(201);
  });

  it("returns 400 when validation throws", async () => {
    globalThis.validateAndCalculateOrderItems = async () => {
      throw new Error("validation failed");
    };
    globalThis.calculateOrderTotal = (o) => 0;

    const supabase = {
      from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: "x" }, error: null }) }) }) }),
    };

    const res = await handleOrders({
      method: "POST",
      pathParameters: {},
      body: { items: [{ product_id: "p1", quantity: 2 }] },
      user: { cognitoId: "u1", email: "a@b.com" },
      supabase,
      processProductImages: () => {},
      addDiscountToProduct: () => {},
      logger: { error: () => {}, debug: () => {} },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
  });
});
