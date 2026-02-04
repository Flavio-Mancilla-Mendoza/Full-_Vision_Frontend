import { OpticalProduct } from "@/types";

/**
 * Convierte un ProductWithBrand (o similar) a OpticalProduct/IProduct global
 * Rellena los campos faltantes con valores nulos o por defecto
 */
export function convertProductWithBrandToOpticalProduct(product: any): OpticalProduct {
  // Refuerzo: category nunca es null y siempre tiene todos los campos requeridos
  let safeCategory;
  if (product.category && typeof product.category === "object") {
    safeCategory = {
      id: "id" in product.category ? product.category.id ?? "" : "",
      name: "name" in product.category ? product.category.name ?? "" : "",
      slug: "slug" in product.category ? product.category.slug ?? "" : "",
      description: "description" in product.category ? product.category.description ?? null : null,
      is_active: "is_active" in product.category ? product.category.is_active ?? null : null,
      created_at: "created_at" in product.category ? product.category.created_at ?? null : null,
      updated_at: "updated_at" in product.category ? product.category.updated_at ?? null : null,
      deleted_at: "deleted_at" in product.category ? product.category.deleted_at ?? null : null,
    };
  } else {
    safeCategory = {
      id: "",
      name: "",
      slug: "",
      description: null,
      is_active: null,
      created_at: null,
      updated_at: null,
      deleted_at: null,
    };
  }
  return {
    ...product,
    deleted_at: product.deleted_at ?? null,
    brand: product.brand
      ? {
          id: product.brand.id ?? "",
          name: product.brand.name ?? "",
          slug: product.brand.slug ?? "",
          logo_url: product.brand.logo_url ?? "",
          description: product.brand.description ?? "",
          is_active: product.brand.is_active ?? true,
          created_at: product.brand.created_at ?? "",
          updated_at: product.brand.updated_at ?? "",
        }
      : undefined,
    category: safeCategory,
    product_images: product.product_images ?? [],
  };
}
