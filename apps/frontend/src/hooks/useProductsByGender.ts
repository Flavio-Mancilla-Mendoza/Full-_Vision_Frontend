/**
 * useProductsByGender - Hook con React Query para productos por género
 * Incluye manejo de errores, cache inteligente y retry logic
 */

import { useQuery } from "@tanstack/react-query";
import { getProductsByGender } from "@/services/productCategories";
import type { ProductWithBrand } from "@/services/productCategories";
import { IProduct } from "@/types/IProducts";

export interface ProductsByGenderData {
  products: ProductWithBrand[];
  groupedByStyle: Record<string, ProductWithBrand[]>;
  availableStyles: string[];
  availableMaterials: string[];
}

interface UseProductsByGenderOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: boolean | number;
}

/**
 * Hook para obtener productos filtrados por género
 * @param gender - Género para filtrar (hombre, mujer, niño)
 * @param options - Opciones de configuración de la query
 * @returns Query result con productos y estados
 */
export function useProductsByGender(gender: string, options: UseProductsByGenderOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 5, retry = 2 } = options;

  return useQuery<IProduct[]>({
    queryKey: ["products", "gender", gender],
    queryFn: async () => {
      const products: IProduct[] = await getProductsByGender(gender);
      return products;
    },
    enabled: enabled && !!gender,
    staleTime,
    gcTime: 1000 * 60 * 20, // 20 minutos
    retry: (failureCount, error) => {
      // No reintentar errores 404 (género no encontrado)
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

/**
 * Hook para obtener atributos dinámicos por género
 */
export function useDynamicAttributesForGender(gender: string, options: UseProductsByGenderOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 5, retry = 2 } = options;

  return useQuery({
    queryKey: ["attributes", "gender", gender],
    queryFn: async () => {
      const { getDynamicAttributesForGender } = await import("@/services/dynamicAttributes");
      const data = await getDynamicAttributesForGender(gender);

      // Validación: debe ser un array
      return Array.isArray(data) ? data : [];
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
