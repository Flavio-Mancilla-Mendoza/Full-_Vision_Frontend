/**
 * Validadores de datos en runtime para proteger contra undefined/null
 * Guards de tipo para TypeScript
 */

import type { ProductWithBrand } from "@/services/productCategories";

/**
 * Valida que un objeto sea un producto válido
 */
export function isValidProduct(product: unknown): product is ProductWithBrand {
  if (!product || typeof product !== "object") return false;

  const p = product as Record<string, unknown>;

  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.base_price === "number" &&
    (p.sale_price === null || typeof p.sale_price === "number") &&
    (p.brand === null || (typeof p.brand === "object" && p.brand !== null))
  );
}

/**
 * Valida que sea un array de productos
 */
export function isValidProductArray(data: unknown): data is ProductWithBrand[] {
  return Array.isArray(data) && data.every(isValidProduct);
}

/**
 * Valida la respuesta de productos por género
 */
export interface ProductsByGenderResponse {
  products: ProductWithBrand[];
  groupedByStyle: Record<string, ProductWithBrand[]>;
  availableStyles: string[];
  availableMaterials: string[];
}

export function isValidProductsByGenderResponse(data: unknown): data is ProductsByGenderResponse {
  if (!data || typeof data !== "object") return false;

  const d = data as Record<string, unknown>;

  return (
    Array.isArray(d.products) &&
    typeof d.groupedByStyle === "object" &&
    d.groupedByStyle !== null &&
    Array.isArray(d.availableStyles) &&
    Array.isArray(d.availableMaterials)
  );
}

/**
 * Sanitiza y retorna valores seguros para productos
 */
export function sanitizeProductsData(data: unknown): ProductsByGenderResponse {
  const defaultResponse: ProductsByGenderResponse = {
    products: [],
    groupedByStyle: {},
    availableStyles: [],
    availableMaterials: [],
  };

  if (!data || typeof data !== "object") {
    return defaultResponse;
  }

  const d = data as Record<string, unknown>;

  return {
    products: Array.isArray(d.products) ? d.products.filter(isValidProduct) : [],
    groupedByStyle:
      d.groupedByStyle && typeof d.groupedByStyle === "object" ? (d.groupedByStyle as Record<string, ProductWithBrand[]>) : {},
    availableStyles: Array.isArray(d.availableStyles) ? d.availableStyles.filter((s): s is string => typeof s === "string") : [],
    availableMaterials: Array.isArray(d.availableMaterials) ? d.availableMaterials.filter((m): m is string => typeof m === "string") : [],
  };
}


