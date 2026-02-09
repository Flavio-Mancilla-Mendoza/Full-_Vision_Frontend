// src/services/liquidacion.ts - Servicio para productos en liquidación
import api from "@/services/api";

export interface LiquidacionProduct {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  discount_percentage: number;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  brand?: {
    name: string;
  } | null;
  category?: {
    name: string;
  } | null;
  product_images?: Array<{
    url: string;
    alt_text: string | null;
    is_primary: boolean;
  }>;
}

/**
 * Obtiene productos en liquidación (con descuentos)
 * Prioriza productos con mayor descuento
 */
export async function getLiquidacionProducts(limit: number = 10): Promise<LiquidacionProduct[]> {
  try {
    // Llamar al endpoint público de liquidación
    const response = await fetch(`${api.getApiUrl()}/public/liquidacion`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const products = (await response.json()) as LiquidacionProduct[];

    // Limitar al número solicitado
    return products.slice(0, limit);
  } catch (error) {
    console.error("Error fetching liquidacion products:", error);
    return [];
  }
}

/**
 * Calcula el precio final con descuento
 */
export function calculateFinalPrice(product: LiquidacionProduct): number {
  if (product.sale_price && product.sale_price < product.base_price) {
    return product.sale_price;
  }

  if (product.discount_percentage && product.discount_percentage > 0) {
    return product.base_price * (1 - product.discount_percentage / 100);
  }

  return product.base_price;
}

/**
 * Calcula el porcentaje de descuento real
 */
export function calculateDiscountPercentage(product: LiquidacionProduct): number | null {
  if (product.sale_price && product.sale_price < product.base_price) {
    return Math.round(((product.base_price - product.sale_price) / product.base_price) * 100);
  }

  return product.discount_percentage ?? null;
}
