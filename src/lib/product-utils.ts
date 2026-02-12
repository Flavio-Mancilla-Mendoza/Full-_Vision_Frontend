import { OpticalProduct } from "@/types";
import type { IProduct } from "@/types/IProducts";

// ==========================================
// Interface mínima para cálculos de precio
// ==========================================

/** Cualquier objeto con campos de precio — cubre IProduct, OpticalProduct, LiquidacionProduct, etc. */
export interface PricedProduct {
  base_price: number;
  sale_price?: number | null;
  discount_percentage?: number | null;
}

// ==========================================
// Funciones centralizadas de precio
// ==========================================

/**
 * Calcula el precio final considerando sale_price y discount_percentage.
 * Prioriza sale_price sobre discount_percentage.
 */
export function calculateFinalPrice(product: PricedProduct): number {
  if (product.sale_price && product.sale_price > 0) {
    return product.sale_price;
  }
  if (product.discount_percentage && product.discount_percentage > 0) {
    return product.base_price * (1 - product.discount_percentage / 100);
  }
  return product.base_price;
}

/**
 * Determina si el producto tiene algún descuento activo.
 */
export function hasProductDiscount(product: PricedProduct): boolean {
  return Boolean(
    (product.sale_price && product.sale_price > 0 && product.sale_price < product.base_price) ||
    (product.discount_percentage && product.discount_percentage > 0)
  );
}

/**
 * Calcula el porcentaje de descuento real.
 * Si hay sale_price, calcula el % a partir de la diferencia con base_price.
 * Si no, usa discount_percentage directamente.
 * Retorna 0 si no hay descuento.
 */
export function calculateDiscountPercentage(product: PricedProduct): number {
  if (product.sale_price && product.sale_price > 0 && product.sale_price < product.base_price) {
    return Math.round(
      ((product.base_price - product.sale_price) / product.base_price) * 100
    );
  }
  if (product.discount_percentage && product.discount_percentage > 0) {
    return product.discount_percentage;
  }
  return 0;
}

// ==========================================
// Constantes de dominio
// ==========================================

/** Mapa de género a label de breadcrumb */
export const GENDER_LABELS: Record<string, string> = {
  hombre: "Lentes para Hombre",
  mujer: "Lentes para Mujer",
  niños: "Lentes para Niños",
};

/** Mapa de género a ruta */
export const GENDER_PATHS: Record<string, string> = {
  hombre: "/hombres",
  mujer: "/mujer",
  niños: "/ninos",
};

// ==========================================
// Utilidades de imágenes de producto
// ==========================================

export interface ProductImageItem {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  s3_key: string;
}

/**
 * Devuelve las imágenes del producto ordenadas por sort_order.
 * Si no hay imágenes extra, usa la image_url principal como fallback.
 */
export function getSortedProductImages(
  product: { image_url?: string | null; name: string; product_images?: ProductImageItem[] | null }
): ProductImageItem[] {
  if (product.product_images && product.product_images.length > 0) {
    return [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  }
  return [{
    id: "main",
    url: product.image_url || "",
    alt_text: product.name,
    is_primary: true,
    sort_order: 0,
    s3_key: "",
  }];
}

/**
 * Construye el título completo del producto: "LENTE DE SOL RAYBAN Modelo X"
 */
export function buildProductTitle(product: { lens_type?: string | null; brand?: { name: string } | null; name: string }): string {
  const lensLabel = product.lens_type
    ? `LENTE DE ${product.lens_type.toUpperCase()}`
    : "LENTE";
  const brandName = product.brand?.name ? product.brand.name.toUpperCase() : "";
  return `${lensLabel} ${brandName} ${product.name}`.trim();
}

// ==========================================
// Utilities for product identifiers: slug and SKU generation
// ==========================================

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateSKU(name: string, frameStyle?: string, frameSize?: string): string {
  const prefix = "FV";
  const nameCode = (name || "")
    .split(" ")
    .map((w) => w.substring(0, 2).toUpperCase())
    .join("")
    .substring(0, 4);
  const styleCode = frameStyle ? frameStyle.substring(0, 3).toUpperCase() : "GEN";
  const sizeCode = frameSize ? frameSize.toUpperCase() : "M";
  const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${nameCode}-${styleCode}-${sizeCode}-${randomCode}`;
}

// ==========================================
// Utilities for product data transformations
// ==========================================

/**
 * Formatea un precio a la moneda local (PEN)
 * Función pura sin efectos secundarios
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(price);
}

/**
 * Transforma un producto (IProduct o OpticalProduct) a formato de carrito.
 * Acepta ambos tipos para evitar casteos innecesarios.
 */
export function transformProductForCart(product: IProduct | OpticalProduct) {
  const brand = product.brand as { id?: string; name: string; slug?: string } | null | undefined;
  return {
    ...product,
    brand: brand ? {
      id: brand.id || product.id,
      name: brand.name,
      slug: brand.slug || '',
      logo_url: "",
      description: "",
      is_active: true,
      created_at: "",
      updated_at: "",
    } : undefined,
    category: undefined,
    product_images: [],
  };
}

/**
 * Calcula el descuento mínimo de una lista de descuentos seleccionados
 * Función pura de cálculo matemático
 */
export function calculateMinDiscount(discounts: string[]): number | undefined {
  if (discounts.length === 0) return undefined;
  return Math.min(...discounts.map(d => parseInt(d)));
}

export default {
  generateSlug,
  generateSKU,
  formatPrice,
  transformProductForCart,
  calculateMinDiscount,
  calculateFinalPrice,
  hasProductDiscount,
  calculateDiscountPercentage,
  getSortedProductImages,
  buildProductTitle,
};
