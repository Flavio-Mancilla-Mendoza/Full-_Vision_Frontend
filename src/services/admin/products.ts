// src/services/admin/products.ts - Gestión de productos (Admin)
import { supabase } from "@/lib/supabase";
import * as api from "@/services/api";
import { getAuthToken } from "./helpers";
import { generateSKU as clientGenerateSKU } from "@/lib/product-utils";
import type { OpticalProduct, ProductCategory, Brand } from "@/types";
import type { Database } from "@/types/database";

// Re-export types
export type { OpticalProduct, ProductCategory, Brand };

/**
 * Obtener todas las categorías
 */
export async function getAllCategories(): Promise<ProductCategory[]> {
  const { data, error } = await supabase.from("product_categories").select("*").order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as ProductCategory[];
}

/**
 * Obtener todas las marcas
 */
export async function getAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as Brand[];
}

/**
 * Verificar si un SKU ya existe
 */
export async function checkSKUExists(sku: string, excludeProductId?: string): Promise<boolean> {
  if (api.USE_PROXY_API) {
    try {
      const res = await fetch(`${api.getApiUrl()}/products/check-sku`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, excludeProductId }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      return !!json.exists;
    } catch (err) {
      console.error("Error checking SKU via API:", err);
      return false;
    }
  }

  let query = supabase.from("products").select("id").eq("sku", sku);
  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error checking SKU:", error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Verificar si un slug ya existe
 */
export async function checkSlugExists(slug: string, excludeProductId?: string): Promise<boolean> {
  if (api.USE_PROXY_API) {
    try {
      const res = await fetch(`${api.getApiUrl()}/products/check-slug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, excludeProductId }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      return !!json.exists;
    } catch (err) {
      console.error("Error checking slug via API:", err);
      return false;
    }
  }

  let query = supabase.from("products").select("id").eq("slug", slug);
  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error checking slug:", error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Generar SKU único
 */
export async function generateProductSKU(opts: {
  name: string;
  frame_style?: string;
  frame_size?: string;
  excludeProductId?: string;
}): Promise<string> {
  const { name, frame_style, frame_size, excludeProductId } = opts;
  if (!name) throw new Error("name is required");

  if (api.USE_PROXY_API) {
    try {
      const response = await fetch(`${api.getApiUrl()}/products/generate-sku`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ name, frame_style, frame_size, excludeProductId }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }

      const json = await response.json();
      return json.sku;
    } catch (error) {
      console.error("Error generating SKU via API:", error);
      throw error;
    }
  }

  // Legacy: local generation + uniqueness check
  let sku = clientGenerateSKU(name, frame_style, frame_size);
  let attempts = 0;
  while (attempts < 5) {
    const exists = await checkSKUExists(sku, excludeProductId);
    if (!exists) break;
    attempts++;
    sku = clientGenerateSKU(name, frame_style, frame_size);
  }
  return sku;
}

/**
 * Obtener todos los productos
 */
export async function getAllOpticalProducts(): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(*)
    `)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as OpticalProduct[];
}

/**
 * Obtener productos con paginación y filtros
 */
export async function getAllOpticalProductsPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string; brandId?: string; discounted?: boolean } = {}
): Promise<{ data: OpticalProduct[]; count: number; totalPages: number }> {
  let query = supabase
    .from("products")
    .select(`
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(*)
    `, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.brandId) {
    query = query.eq("brand_id", filters.brandId);
  }

  if (typeof filters.discounted === "boolean") {
    if (filters.discounted) query = query.gt("discount_percentage", 0);
    else query = query.eq("discount_percentage", 0);
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q},sku.ilike.${q},slug.ilike.${q}`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as OpticalProduct[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Crear producto
 */
export async function createOpticalProduct(productData: Database["public"]["Tables"]["products"]["Insert"]) {
  if (api.USE_PROXY_API) {
    try {
      const response = await fetch(`${api.getApiUrl()}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating product via API:", error);
      throw error;
    }
  }

  const { data, error } = await supabase.from("products").insert([productData]).select().single();
  if (error) {
    console.error("Error creating product in Supabase:", error);
    throw error;
  }
  return data;
}

/**
 * Actualizar producto
 */
export async function updateOpticalProduct(productId: string, updates: Partial<OpticalProduct>) {
  if (api.USE_PROXY_API) {
    try {
      const response = await fetch(`${api.getApiUrl()}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating product via API:", error);
      throw error;
    }
  }

  const { data, error } = await supabase.from("products").update(updates).eq("id", productId).select().single();
  if (error) throw error;
  return data;
}

/**
 * Desactivar producto (marcar como reservado/vendido)
 */
export async function deactivateProduct(productId: string, reason?: string) {
  console.log(`🔒 Desactivando producto: ${productId}`, reason ? `(${reason})` : "");

  const { data, error } = await supabase
    .from("products")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  console.log("✅ Producto desactivado");
  return data;
}

/**
 * Reactivar producto
 */
export async function reactivateProduct(productId: string) {
  console.log(`🔓 Reactivando producto: ${productId}`);

  const { data, error } = await supabase
    .from("products")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  console.log("✅ Producto reactivado");
  return data;
}

/**
 * Reactivar todos los productos de una orden
 */
export async function reactivateOrderProducts(orderId: string) {
  console.log(`🔄 Reactivando productos de la orden: ${orderId}`);

  const { data: orderItems, error: itemsError } = await supabase.from("order_items").select("product_id").eq("order_id", orderId);

  if (itemsError) throw itemsError;

  if (!orderItems || orderItems.length === 0) {
    console.log("⚠️ No hay productos en esta orden");
    return;
  }

  const productIds = orderItems.map((item) => item.product_id).filter((id): id is string => id !== null);

  const { error: reactivateError } = await supabase
    .from("products")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .in("id", productIds);

  if (reactivateError) throw reactivateError;

  console.log(`✅ ${productIds.length} productos reactivados`);
  return productIds;
}

/**
 * Eliminar producto
 */
export async function deleteOpticalProduct(productId: string) {
  // Import images module to avoid circular dependency
  const { getProductImages, deleteProductImageFromStorage } = await import("@/services/admin/images");

  if (api.USE_PROXY_API) {
    try {
      const response = await fetch(`${api.getApiUrl()}/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting product via API:", error);
      throw error;
    }
  }

  try {
    console.log("🔍 Obteniendo imágenes del producto:", productId);
    const images = await getProductImages(productId);
    console.log("📸 Imágenes encontradas:", images.length);

    console.log("🗑️ Eliminando producto de la BD:", productId);
    const { data, error } = await supabase.from("products").delete().eq("id", productId).select().single();

    if (error) throw error;

    if (images && images.length > 0) {
      console.log("🗑️ Eliminando", images.length, "imágenes del Storage...");
      for (const image of images) {
        if (image.url) {
          try {
            await deleteProductImageFromStorage(image.url);
          } catch (err) {
            console.warn("Error eliminando imagen del storage:", err);
          }
        }
      }
      console.log("✅ Imágenes eliminadas del Storage");
    }

    console.log("✅ Producto eliminado completamente:", productId);
    return data;
  } catch (error) {
    console.error("❌ Error eliminando producto:", error);
    throw error;
  }
}
