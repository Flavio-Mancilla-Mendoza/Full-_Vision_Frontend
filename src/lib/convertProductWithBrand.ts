import { OpticalProduct, ProductWithRelations, DbProductCategory, DbBrand, DbProductImage } from "@/types";

/**
 * Convierte un ProductWithRelations (producto de Supabase con joins) a OpticalProduct
 * Normaliza los campos para asegurar que las propiedades opcionales estén correctamente tipadas
 */
export function convertProductWithBrandToOpticalProduct(product: ProductWithRelations): OpticalProduct {
  // Normalizar category: convertir null a undefined y asegurar todos los campos
  const category: DbProductCategory | undefined = product.category ?? undefined;

  // Normalizar brand: convertir null a undefined y asegurar todos los campos
  const brand: DbBrand | undefined = product.brand ?? undefined;

  // Normalizar product_images: convertir null a array vacío
  const product_images: DbProductImage[] = product.product_images ?? [];

  return {
    ...product,
    category,
    brand,
    product_images,
    deleted_at: null, // OpticalProduct permite deleted_at, pero DbProduct no lo tiene
  };
}
