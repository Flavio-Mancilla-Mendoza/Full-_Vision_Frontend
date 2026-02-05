// src/services/admin/featured.ts - Productos destacados y bestsellers (Admin)
import { supabase } from "@/lib/supabase";
import type { OpticalProduct } from "@/types";

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(id, product_id, url, s3_key, alt_text, sort_order, is_primary, created_at)
    `)
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) throw error;

  const processedData =
    data?.map((product) => ({
      ...product,
      product_images: product.product_images?.filter((img) => img.is_primary) || [],
    })) || [];

  return processedData as unknown as OpticalProduct[];
}

/**
 * Marcar producto como destacado
 */
export async function setProductAsFeatured(productId: string, featured: boolean = true) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtener productos disponibles para destacar
 */
export async function getAvailableProductsForFeatured(): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(id, product_id, url, s3_key, alt_text, sort_order, is_primary, created_at)
    `)
    .eq("is_featured", false)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  const processedData =
    data?.map((product) => ({
      ...product,
      product_images: product.product_images?.filter((img) => img.is_primary) || [],
    })) || [];

  return processedData as unknown as OpticalProduct[];
}

/**
 * Obtener productos más vendidos
 */
export async function getBestSellingProducts(limit: number = 10): Promise<OpticalProduct[]> {
  const { data: salesData, error: salesError } = await supabase
    .from("order_items")
    .select(`
      product_id,
      quantity,
      products!inner(
        *,
        category:product_categories(*),
        brand:brands(*),
        product_images(*)
      )
    `)
    .eq("products.is_active", true);

  if (salesError) {
    console.error("Error fetching sales data:", salesError);
  }

  if (salesData && salesData.length > 0) {
    const productSales: Record<string, { product: OpticalProduct; totalSold: number }> = {};

    salesData.forEach((item) => {
      const productId = item.product_id;
      if (item.products && productId && typeof item.products === "object" && !Array.isArray(item.products)) {
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.products as OpticalProduct,
            totalSold: 0,
          };
        }
        productSales[productId].totalSold += Number(item.quantity) || 0;
      }
    });

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)
      .map((item) => item.product);

    return sortedProducts;
  }

  return await simulateBestSellers(limit);
}

/**
 * Simular best sellers cuando no hay datos de ventas
 */
async function simulateBestSellers(limit: number): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(*)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  if (!data || data.length === 0) return [];

  const productsWithScore = data.map((product) => {
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
