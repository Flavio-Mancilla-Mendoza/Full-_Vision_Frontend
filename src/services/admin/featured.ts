// src/services/admin/featured.ts - Productos destacados y bestsellers (Admin) via API Gateway
import { productsApi, ordersApi } from "@/services/api";
import type { OpticalProduct } from "@/types";

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(): Promise<OpticalProduct[]> {
  const allProducts = await productsApi.list();
  const featured = (allProducts || []).filter(
    (p) => p.is_featured && p.is_active !== false
  );

  const processedData = featured.map((product) => ({
    ...product,
    product_images: product.product_images?.filter((img) => img.is_primary) || [],
  }));

  return processedData.slice(0, 8) as unknown as OpticalProduct[];
}

/**
 * Marcar producto como destacado
 */
export async function setProductAsFeatured(productId: string, featured: boolean = true) {
  const data = await productsApi.update(productId, {
    is_featured: featured,
  });
  return data;
}

/**
 * Obtener productos disponibles para destacar
 */
export async function getAvailableProductsForFeatured(): Promise<OpticalProduct[]> {
  const allProducts = await productsApi.list();
  const available = (allProducts || []).filter(
    (p) => !p.is_featured && p.is_active !== false
  );

  const processedData = available
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .map((product) => ({
      ...product,
      product_images: product.product_images?.filter((img) => img.is_primary) || [],
    }));

  return processedData as unknown as OpticalProduct[];
}

/**
 * Obtener productos más vendidos
 */
export async function getBestSellingProducts(limit: number = 10): Promise<OpticalProduct[]> {
  try {
    // Get all orders and products
    const [orders, allProducts] = await Promise.all([
      ordersApi.list(),
      productsApi.list(),
    ]);

    // Build a map of product sales from order items
    const productSales: Record<string, number> = {};

    for (const order of orders || []) {
      if (order.order_items) {
        for (const item of order.order_items) {
          if (item.product_id) {
            productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.quantity || 0);
          }
        }
      }
    }

    if (Object.keys(productSales).length > 0) {
      // Create a map of products by ID
      const productMap: Record<string, OpticalProduct> = {};
      for (const product of (allProducts || []) as unknown as OpticalProduct[]) {
        if (product.is_active !== false) {
          productMap[product.id] = product;
        }
      }

      // Sort by sales and return top sellers
      const sortedProducts = Object.entries(productSales)
        .filter(([id]) => productMap[id])
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => productMap[id]);

      return sortedProducts;
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
  }

  // Fallback: simulate best sellers
  return await simulateBestSellers(limit);
}

/**
 * Simular best sellers cuando no hay datos de ventas
 */
async function simulateBestSellers(limit: number): Promise<OpticalProduct[]> {
  const allProducts = (await productsApi.list()) as unknown as OpticalProduct[];
  const activeProducts = (allProducts || []).filter((p) => p.is_active !== false);

  if (activeProducts.length === 0) return [];

  const productsWithScore = activeProducts.map((product) => {
    let score = 0;

    if (product.is_bestseller) score += 100;

    const price = product.base_price;
    if (price >= 100 && price <= 200) score += 50;
    else if (price >= 80 && price <= 100) score += 40;
    else if (price >= 200 && price <= 300) score += 30;

    if (product.lens_type === "graduado") score += 60;
    else if (product.lens_type === "solar") score += 50;
    else if (product.lens_type === "filtro-azul") score += 40;

    if (product.gender === "unisex") score += 30;
    else if (product.gender === "mujer") score += 25;
    else if (product.gender === "hombre") score += 20;

    if ((product.discount_percentage ?? 0) > 0) score += 20;

    if (product.product_images && product.product_images.length > 0) score += 15;

    score += Math.random() * 25;

    return { ...product, simulatedScore: score };
  });

  return productsWithScore
    .sort((a, b) => b.simulatedScore - a.simulatedScore)
    .slice(0, limit)
    .map(({ simulatedScore, ...product }) => product) as unknown as OpticalProduct[];
}
