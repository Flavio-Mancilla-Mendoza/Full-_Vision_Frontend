// src/services/featured.ts - Servicio público para productos destacados
import api from "@/services/api";

export interface FeaturedProduct {
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
  image_url: string | null;
  image_alt?: string;

  // Estado del producto
  stock_quantity: number;
  is_active: boolean;

  // Metadatos
  is_featured: boolean;
  is_bestseller: boolean;

  // Categoría y marca
  category_name?: string;
  brand_name?: string;
  brand?: { id: string; name: string; slug: string };
}

// Obtener productos destacados para mostrar en el home
export async function getFeaturedProductsForHome(): Promise<FeaturedProduct[]> {
  try {
    // Usar endpoint público (no requiere autenticación)
    const products = await api.products.getPublic();

    // Filtrar productos destacados activos y limitar a 8
    const featuredProducts = products.filter((p) => p.is_featured && p.is_active).slice(0, 8);

    return featuredProducts as FeaturedProduct[];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Función para determinar el badge de un producto
export function getProductBadge(product: FeaturedProduct): string {
  if (product.is_bestseller) return "Bestseller";
  if (product.discount_percentage > 0) return "Oferta";
  if (product.lens_type?.includes("filtro")) return "Nuevo";
  return "Popular";
}

// Función para obtener el color del badge
export function getBadgeColor(badge: string): string {
  switch (badge) {
    case "Bestseller":
      return "bg-emerald-500 text-white";
    case "Oferta":
      return "bg-red-500 text-white";
    case "Nuevo":
      return "bg-blue-500 text-white";
    case "Premium":
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}
