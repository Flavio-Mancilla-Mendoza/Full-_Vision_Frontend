import { IProduct } from "@/types/IProducts";
import { BestSellerProduct } from "@/services/bestsellers";
import { FeaturedProduct } from "@/services/featured";
import { LiquidacionProduct } from "@/services/liquidacion";

/**
 * Convierte un BestSellerProduct en un IProduct global
 * Rellena los campos faltantes con valores nulos o por defecto
 */
export function convertBestSellerToProduct(bestSeller: BestSellerProduct): IProduct {
  return {
    id: bestSeller.id,
    name: bestSeller.name,
    description: bestSeller.description ?? null,
    slug: bestSeller.name.toLowerCase().replace(/\s+/g, "-"), // Genera un slug simple
    sku: null,
    base_price: bestSeller.base_price,
    sale_price: bestSeller.sale_price ?? null,
    category_id: null,
    brand_id: null,
    stock_quantity: bestSeller.stock_quantity,
    min_stock_level: null,
    frame_material: bestSeller.frame_material ?? null,
    lens_type: bestSeller.lens_type ?? null,
    frame_style: bestSeller.frame_style ?? null,
    frame_size: null,
    lens_color: null,
    frame_color: null,
    gender: bestSeller.gender ?? null,
    bridge_width: null,
    temple_length: null,
    lens_width: null,
    has_uv_protection: null,
    has_blue_filter: null,
    is_photochromic: null,
    has_anti_reflective: null,
    is_active: bestSeller.is_active,
    is_featured: null,
    is_bestseller: bestSeller.is_bestseller,
    meta_title: null,
    meta_description: null,
    created_at: null,
    updated_at: null,
    image_url: bestSeller.image_url ?? null,
    deleted_at: null,
    discount_percentage: bestSeller.discount_percentage ?? null,
    category: bestSeller.category_name
      ? {
          id: "",
          name: bestSeller.category_name,
          slug: "",
          description: null,
          is_active: null,
          created_at: null,
          updated_at: null,
          deleted_at: null,
        }
      : null,
    brand: bestSeller.brand_name ? { name: bestSeller.brand_name } : null,
    product_images: [],
  };
}

/**
 * Convierte un FeaturedProduct en un IProduct global
 * Rellena los campos faltantes con valores nulos o por defecto
 */
export function convertFeaturedToProduct(featured: FeaturedProduct): IProduct {
  return {
    id: featured.id,
    name: featured.name,
    description: featured.description ?? null,
    slug: featured.name.toLowerCase().replace(/\s+/g, "-"),
    sku: null,
    base_price: featured.base_price,
    sale_price: featured.sale_price ?? null,
    category_id: null,
    brand_id: null,
    stock_quantity: featured.stock_quantity,
    min_stock_level: null,
    frame_material: featured.frame_material ?? null,
    lens_type: featured.lens_type ?? null,
    frame_style: featured.frame_style ?? null,
    frame_size: null,
    lens_color: null,
    frame_color: null,
    gender: featured.gender ?? null,
    bridge_width: null,
    temple_length: null,
    lens_width: null,
    has_uv_protection: null,
    has_blue_filter: null,
    is_photochromic: null,
    has_anti_reflective: null,
    is_active: featured.is_active,
    is_featured: featured.is_featured,
    is_bestseller: featured.is_bestseller,
    meta_title: null,
    meta_description: null,
    created_at: null,
    updated_at: null,
    image_url: featured.image_url ?? null,
    deleted_at: null,
    discount_percentage: featured.discount_percentage ?? null,
    category: featured.category_name
      ? {
          id: "",
          name: featured.category_name,
          slug: "",
          description: null,
          is_active: null,
          created_at: null,
          updated_at: null,
          deleted_at: null,
        }
      : null,
    brand: featured.brand_name ? { name: featured.brand_name } : null,
    product_images: [],
  };
}

/**
 * Convierte un LiquidacionProduct en un IProduct global
 * Rellena los campos faltantes con valores nulos o por defecto
 */
export function convertLiquidacionToProduct(liquidacion: LiquidacionProduct): IProduct {
  return {
    id: liquidacion.id,
    name: liquidacion.name,
    description: liquidacion.description ?? null,
    slug: liquidacion.name.toLowerCase().replace(/\s+/g, "-"),
    sku: null,
    base_price: liquidacion.base_price,
    sale_price: liquidacion.sale_price ?? null,
    category_id: null,
    brand_id: null,
    stock_quantity: liquidacion.stock_quantity,
    min_stock_level: null,
    frame_material: null,
    lens_type: null,
    frame_style: null,
    frame_size: null,
    lens_color: null,
    frame_color: null,
    gender: null,
    bridge_width: null,
    temple_length: null,
    lens_width: null,
    has_uv_protection: null,
    has_blue_filter: null,
    is_photochromic: null,
    has_anti_reflective: null,
    is_active: liquidacion.is_active,
    is_featured: null,
    is_bestseller: null,
    meta_title: null,
    meta_description: null,
    created_at: null,
    updated_at: null,
    image_url: liquidacion.image_url ?? null,
    deleted_at: null,
    discount_percentage: liquidacion.discount_percentage ?? null,
    category: liquidacion.category
      ? {
          id: "",
          name: liquidacion.category.name,
          slug: "",
          description: null,
          is_active: null,
          created_at: null,
          updated_at: null,
          deleted_at: null,
        }
      : null,
    brand: liquidacion.brand ? { name: liquidacion.brand.name } : null,
    product_images: liquidacion.product_images
      ? liquidacion.product_images.map((img) => ({
          id: "",
          url: img.url,
          s3_key: "",
          alt_text: img.alt_text ?? "",
          is_primary: img.is_primary ?? false,
          sort_order: 0,
        }))
      : [],
  };
}
