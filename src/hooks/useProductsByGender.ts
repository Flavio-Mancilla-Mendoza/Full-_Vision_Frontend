/**
 * useProductsByGender - Hook con React Query para productos por género
 * ACTUALIZADO: Ahora maneja filtros, ordenamiento y paginación en el backend
 */

import { useQuery } from "@tanstack/react-query";
import { getProductsByGender, type ProductFilters, type ProductsResponse } from "@/services/productCategories";

interface UseProductsByGenderOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: boolean | number;
}

/**
 * Hook para obtener productos filtrados por género con filtros del backend
 * @param filters - Filtros de productos (género, marcas, precio, etc.)
 * @param options - Opciones de configuración de la query
 * @returns Query result con productos paginados y estados
 */
export function useProductsByGender(filters: ProductFilters, options: UseProductsByGenderOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 2, retry = 2 } = options;

  return useQuery<ProductsResponse>({
    queryKey: ["products", "filtered", filters],
    queryFn: async () => {
      return await getProductsByGender(filters);
    },
    enabled: enabled && !!filters.gender,
    staleTime,
    gcTime: 1000 * 60 * 10, // 10 minutos (reducido porque ahora filtramos en backend)
    retry: (failureCount, error) => {
      // No reintentar errores 404
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return typeof retry === "number" ? failureCount < retry : retry;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Hook para obtener filtros dinámicos por género
 */
export function useDynamicFiltersForGender(gender: string, options: UseProductsByGenderOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 5, retry = 2 } = options;

  return useQuery({
    queryKey: ["filters", "gender", gender],
    queryFn: async () => {
      const { getDynamicFiltersForGender } = await import("@/services/productCategories");
      const data = await getDynamicFiltersForGender(gender);

      // Validación y valores por defecto
      return {
        discounts: Array.isArray(data?.discounts) ? data.discounts : [],
        brands: Array.isArray(data?.brands) ? data.brands : [],
        priceRange: {
          min: data?.priceRange?.min ?? 0,
          max: data?.priceRange?.max ?? 1000,
        },
      };
    },
    enabled: enabled && !!gender,
    staleTime,
    gcTime: 1000 * 60 * 20,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return typeof retry === "number" ? failureCount < retry : retry;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}


