/**
 * useProductDetail - Hook para obtener detalle de un producto por slug
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { IProduct } from "@/types/IProducts";

/**
 * Fetch product detail by slug from the public API
 */
async function fetchProductBySlug(slug: string): Promise<IProduct> {
  const response = await fetch(`${api.getApiUrl()}/public/products/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Producto no encontrado");
    }
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

/**
 * Hook para obtener un producto por slug
 */
export function useProductDetail(slug: string | undefined) {
  return useQuery<IProduct>({
    queryKey: ["product", "detail", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 15,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("no encontrado")) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
}
