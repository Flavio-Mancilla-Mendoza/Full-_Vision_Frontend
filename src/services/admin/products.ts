// src/services/admin/products.ts - Gestión de productos (Admin) via API Gateway
import { productsApi, brandsApi, categoriesApi, ordersApi, getApiUrl } from "@/services/api";
import { getAuthToken } from "./helpers";
import type { OpticalProduct, ProductCategory, Brand } from "@/types";
import type { Database } from "@/types/database";

// Re-export types
export type { OpticalProduct, ProductCategory, Brand };

/**
 * Obtener todas las categorías
 */
export async function getAllCategories(): Promise<ProductCategory[]> {
  const data = await categoriesApi.list();
  return (data || []) as unknown as ProductCategory[];
}

/**
 * Obtener todas las marcas
 */
export async function getAllBrands(): Promise<Brand[]> {
  const data = await brandsApi.list();
  return (data || []) as unknown as Brand[];
}

/**
 * Verificar si un SKU ya existe
 */
export async function checkSKUExists(sku: string, excludeProductId?: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/products/check-sku`, {
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

/**
 * Verificar si un slug ya existe
 */
export async function checkSlugExists(slug: string, excludeProductId?: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/products/check-slug`, {
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

  const response = await fetch(`${getApiUrl()}/products/generate-sku`, {
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
}

/**
 * Obtener todos los productos
 */
export async function getAllOpticalProducts(): Promise<OpticalProduct[]> {
  const data = await productsApi.list();
  return (data || []) as unknown as OpticalProduct[];
}

/**
 * Obtener productos con paginación y filtros (client-side filtering)
 */
export async function getAllOpticalProductsPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string; brandId?: string; discounted?: boolean } = {}
): Promise<{ data: OpticalProduct[]; count: number; totalPages: number }> {
  const allProducts = (await productsApi.list()) as unknown as OpticalProduct[];
  let filtered = allProducts || [];

  if (filters.brandId) {
    filtered = filtered.filter((p) => p.brand_id === filters.brandId);
  }

  if (typeof filters.discounted === "boolean") {
    if (filters.discounted) {
      filtered = filtered.filter((p) => (p.discount_percentage ?? 0) > 0);
    } else {
      filtered = filtered.filter((p) => (p.discount_percentage ?? 0) === 0);
    }
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
    );
  }

  const count = filtered.length;
  const totalPages = Math.ceil(count / limit);
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return { data: paged, count, totalPages };
}

/**
 * Crear producto
 */
export async function createOpticalProduct(productData: Database["public"]["Tables"]["products"]["Insert"]) {
  const response = await fetch(`${getApiUrl()}/products`, {
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
}

/**
 * Actualizar producto
 */
export async function updateOpticalProduct(productId: string, updates: Partial<OpticalProduct>) {
  const response = await fetch(`${getApiUrl()}/products/${productId}`, {
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
}

/**
 * Desactivar producto (marcar como reservado/vendido)
 */
export async function deactivateProduct(productId: string, _reason?: string) {
  return await productsApi.update(productId, {
    is_active: false,
  });
}

/**
 * Reactivar producto
 */
export async function reactivateProduct(productId: string) {
  return await productsApi.update(productId, {
    is_active: true,
  });
}

/**
 * Reactivar todos los productos de una orden
 */
export async function reactivateOrderProducts(orderId: string) {
  const order = await ordersApi.get(orderId);

  if (!order?.order_items || order.order_items.length === 0) {
    return;
  }

  const productIds = order.order_items
    .map((item) => item.product_id)
    .filter((id): id is string => id !== null && id !== undefined);

  const results = await Promise.allSettled(
    productIds.map((id) => productsApi.update(id, { is_active: true }))
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(`Failed to reactivate ${failed.length} products`);
  }

  return productIds;
}

/**
 * Eliminar producto
 */
export async function deleteOpticalProduct(productId: string) {
  const { getProductImages, deleteProductImageFromStorage } = await import("@/services/admin/images");

  try {
    const images = await getProductImages(productId);

    const response = await fetch(`${getApiUrl()}/products/${productId}`, {
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

    if (images && images.length > 0) {
      for (const image of images) {
        if (image.url) {
          try {
            await deleteProductImageFromStorage(image.url);
          } catch (err) {
            console.warn("Error eliminando imagen del storage:", err);
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error eliminando producto:", error);
    throw error;
  }
}
