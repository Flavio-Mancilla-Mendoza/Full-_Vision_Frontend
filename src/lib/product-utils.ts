import { IProduct } from "@/types/IProducts";
import { OpticalProduct } from "@/types/ICartProduct";

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
 * Transforma un producto de la API a formato de carrito
 * Mapeo de datos sin lógica de negocio
 */
export function transformProductForCart(product: IProduct): OpticalProduct {
  return {
    ...product,
    brand: product.brand ? {
      id: product.id,
      name: product.brand.name,
      slug: product.slug,
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

export default { generateSlug, generateSKU, formatPrice, transformProductForCart, calculateMinDiscount };
