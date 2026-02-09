/**
 * Bestsellers Service - Cliente para API Gateway
 * Maneja los productos más vendidos para carrusel y secciones destacadas
 */

import { getApiUrl } from "@/services/api";

// ================================================================
// Types
// ================================================================

export interface BestSellerProduct {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  base_price: number;
  sale_price?: number;
  discount_percentage: number;

  // Características del producto
  frame_material?: string;
  lens_type?: string;
  frame_style?: string;
  gender?: string;

  // Imagen principal
  image_url?: string;
  image_alt?: string;

  // Estado del producto
  stock_quantity: number;
  is_active: boolean;

  // Metadatos
  is_bestseller: boolean;
  total_sold?: number;
  simulated_rank?: number;

  // Categoría y marca
  category_name?: string;
  brand_name?: string;
  brand?: { id: string; name: string; slug: string };
}

// ================================================================
// Helper Functions
// ================================================================

/**
 * Hacer request público a API Gateway (sin autenticación)
 */
async function apiRequestPublic<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${getApiUrl()}${endpoint}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

// ================================================================
// Bestsellers API
// ================================================================

export const bestsellersApi = {
  /**
   * Obtener productos más vendidos para carrusel (público)
   */
  getForCarousel: async (): Promise<BestSellerProduct[]> => {
    try {
      return await apiRequestPublic<BestSellerProduct[]>("/public/bestsellers");
    } catch (error) {
      console.error("Error fetching bestsellers:", error);
      return [];
    }
  },
};

// ================================================================
// Badge Utilities
// ================================================================

/**
 * Obtener el texto del badge según el ranking del producto
 */
export function getBestSellerBadge(product: BestSellerProduct, rank: number): string {
  if (rank <= 3) return `#${rank} Más Vendido`;
  if (product.discount_percentage > 0) return "En Oferta";
  if (product.is_bestseller) return "Bestseller";
  return "Popular";
}

/**
 * Obtener las clases CSS del badge según el texto
 */
export function getBestSellerBadgeColor(badge: string): string {
  const colorMap: Record<string, string> = {
    "#1": "bg-yellow-500 text-white",
    "#2": "bg-gray-400 text-white",
    "#3": "bg-amber-600 text-white",
    "Oferta": "bg-red-500 text-white",
    "Bestseller": "bg-emerald-500 text-white",
  };

  for (const [key, value] of Object.entries(colorMap)) {
    if (badge.includes(key)) return value;
  }

  return "bg-blue-500 text-white";
}

// ================================================================
// Exports de compatibilidad (deprecated)
// ================================================================

/** @deprecated Usar bestsellersApi.getForCarousel() */
export const getBestSellersForCarousel = () => bestsellersApi.getForCarousel();

// ================================================================
// Default Export
// ================================================================

export default {
  bestsellers: bestsellersApi,
  getBestSellerBadge,
  getBestSellerBadgeColor,
};
