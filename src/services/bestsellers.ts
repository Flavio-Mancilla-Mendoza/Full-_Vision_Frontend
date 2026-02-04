// src/services/bestsellers.ts - Servicio para productos más vendidos
import api from "@/services/api";

export interface BestSellerProduct {
  id: string;
  name: string;
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
  total_sold?: number; // Para productos con ventas reales
  simulated_rank?: number; // Para productos simulados

  // Categoría y marca
  category_name?: string;
  brand_name?: string;
}

// Obtener productos más vendidos para mostrar en carrusel
export async function getBestSellersForCarousel(): Promise<BestSellerProduct[]> {
  try {
    // Usar API Gateway para obtener bestsellers
    const response = await fetch(`${api.getApiUrl()}/public/bestsellers`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const products = await response.json();
    return products as BestSellerProduct[];
  } catch (error) {
    console.error("Error fetching bestsellers from API:", error);
    return [];
  }
}
async function getRealSalesData(): Promise<BestSellerProduct[]> {
  try {
    const { data: salesData, error } = await supabase
      .from("order_items")
      .select(
        `
        product_id,
        quantity,
        products!inner(
          id, name, description, base_price, sale_price, discount_percentage,
          frame_material, lens_type, frame_style, gender, stock_quantity, 
          is_active, is_bestseller,
          category:product_categories(name),
          brand:brands(name),
          product_images!inner(url, alt_text, is_primary)
        )
      `
      )
      .eq("products.is_active", true)
      .eq("products.product_images.is_primary", true);

    if (error || !salesData || salesData.length === 0) {
      return [];
    }

    // Agrupar ventas por producto usando Map para mejor tipado
    const salesByProduct = new Map<string, { product: unknown; totalSold: number }>();

    salesData.forEach((item) => {
      const productId = item.product_id;
      const existing = salesByProduct.get(productId);
      if (existing) {
        existing.totalSold += item.quantity;
      } else {
        salesByProduct.set(productId, {
          product: item.products,
          totalSold: item.quantity,
        });
      }
    });

    // Convertir a array y ordenar por ventas
    return Array.from(salesByProduct.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)
      .map((item, index) => transformToCarouselProduct(item.product, item.totalSold, index + 1));
  } catch (error) {
    console.error("Error fetching real sales data:", error);
    return [];
  }
}

// Función para simular best sellers cuando no hay datos reales
async function getSimulatedBestSellers(): Promise<BestSellerProduct[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, name, description, base_price, sale_price, discount_percentage,
        frame_material, lens_type, frame_style, gender, stock_quantity,
        is_active, is_bestseller,
        category:product_categories(name),
        brand:brands(name),
        product_images!inner(url, alt_text, is_primary)
      `
      )
      .eq("is_active", true)
      .eq("product_images.is_primary", true)
      .limit(20); // Obtener más productos para poder simular variedad

    if (error || !data || data.length === 0) {
      return [];
    }

    // Aplicar algoritmo de scoring para simular popularidad
    const productsWithScore = data.map((product) => {
      let score = 0;

      // Bestseller marcado manualmente tiene prioridad máxima
      if (product.is_bestseller) score += 100;

      // Scoring por precio (productos en rango medio populares)
      const price = product.base_price;
      if (price >= 120 && price <= 180) score += 50;
      else if (price >= 80 && price <= 120) score += 40;
      else if (price >= 180 && price <= 250) score += 35;
      else if (price >= 60 && price <= 80) score += 30;

      // Scoring por tipo de lente
      switch (product.lens_type) {
        case "graduado":
          score += 60;
          break;
        case "solar":
          score += 55;
          break;
        case "filtro-azul":
          score += 45;
          break;
        case "fotocromático":
          score += 40;
          break;
        default:
          score += 20;
      }

      // Scoring por género
      switch (product.gender) {
        case "unisex":
          score += 35;
          break;
        case "mujer":
          score += 30;
          break;
        case "hombre":
          score += 25;
          break;
        case "niño":
          score += 15;
          break;
        default:
          score += 10;
      }

      // Scoring por estilo de montura
      switch (product.frame_style) {
        case "rectangular":
          score += 25;
          break;
        case "aviador":
          score += 20;
          break;
        case "redondo":
          score += 18;
          break;
        case "cat-eye":
          score += 15;
          break;
        default:
          score += 10;
      }

      // Bonus por descuento activo
      if (product.discount_percentage > 0) score += 25;

      // Factor aleatorio para variedad (10% del score)
      score += Math.random() * (score * 0.1);

      return { ...product, score };
    });

    // Ordenar por score y tomar los top 10
    return productsWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((product, index) => transformToCarouselProduct(product, undefined, index + 1));
  } catch (error) {
    console.error("Error simulating best sellers:", error);
    return [];
  }
}

// Función helper para transformar datos del producto a formato de carrusel
function transformToCarouselProduct(product: unknown, totalSold?: number, rank?: number): BestSellerProduct {
  const prod = product as Record<string, unknown>;
  const images = prod.product_images as Record<string, unknown>[] | Record<string, unknown>;
  const category = prod.category as Record<string, unknown>[] | Record<string, unknown>;
  const brand = prod.brand as Record<string, unknown>[] | Record<string, unknown>;

  const baseProduct = {
    id: prod.id as string,
    name: prod.name as string,
    description: prod.description as string,
    base_price: prod.base_price as number,
    sale_price: prod.sale_price as number,
    discount_percentage: prod.discount_percentage as number,
    frame_material: prod.frame_material as string,
    lens_type: prod.lens_type as string,
    frame_style: prod.frame_style as string,
    gender: prod.gender as string,
    stock_quantity: prod.stock_quantity as number,
    is_active: prod.is_active as boolean,
    is_bestseller: prod.is_bestseller as boolean,
    total_sold: totalSold,
    simulated_rank: rank,
    category_name: Array.isArray(category)
      ? ((category[0] as Record<string, unknown>)?.name as string)
      : ((category as Record<string, unknown>)?.name as string),
    brand_name: Array.isArray(brand)
      ? ((brand[0] as Record<string, unknown>)?.name as string)
      : ((brand as Record<string, unknown>)?.name as string),
    image_url: Array.isArray(images)
      ? ((images[0] as Record<string, unknown>)?.url as string)
      : ((images as Record<string, unknown>)?.url as string),
    image_alt: Array.isArray(images)
      ? ((images[0] as Record<string, unknown>)?.alt_text as string) || (prod.name as string)
      : ((images as Record<string, unknown>)?.alt_text as string) || (prod.name as string),
  };

  // Normalizar valores numéricos (0 -> null)
  return normalizeProduct(baseProduct);
}

// Función para obtener el badge apropiado para best sellers
export function getBestSellerBadge(product: BestSellerProduct, rank: number): string {
  if (rank <= 3) return `#${rank} Más Vendido`;
  if (product.discount_percentage > 0) return "En Oferta";
  if (product.is_bestseller) return "Bestseller";
  return "Popular";
}

// Función para obtener el color del badge
export function getBestSellerBadgeColor(badge: string): string {
  if (badge.includes("#1")) return "bg-yellow-500 text-white";
  if (badge.includes("#2")) return "bg-gray-400 text-white";
  if (badge.includes("#3")) return "bg-amber-600 text-white";
  if (badge.includes("Oferta")) return "bg-red-500 text-white";
  if (badge.includes("Bestseller")) return "bg-emerald-500 text-white";
  return "bg-blue-500 text-white";
}
