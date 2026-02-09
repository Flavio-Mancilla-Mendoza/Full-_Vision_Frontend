/**
 * Custom hook para manejar la lógica de filtros de productos
 * Separa la lógica de negocio del componente UI
 */

import { useState, useEffect, useMemo } from "react";
import { type ProductFilters } from "@/services/productCategories";
import { calculateMinDiscount } from "@/lib/product-utils";

interface FilterState {
  cyber_discount: string[];
  brand: string[];
  price_min: number;
  price_max: number;
  [key: string]: string[] | number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface UseProductFiltersOptions {
  defaultPriceRange?: PriceRange;
}

export function useProductFilters(
  gender: string,
  options: UseProductFiltersOptions = {}
) {
  const { defaultPriceRange } = options;

  // Estados de filtros locales (UI)
  const [filters, setFilters] = useState<FilterState>({
    cyber_discount: [],
    brand: [],
    price_min: defaultPriceRange?.min ?? 0,
    price_max: defaultPriceRange?.max ?? 999999,
  });

  // Estados para controlar los acordeones
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cyber_discount: false,
    brand: false,
    price: false,
  });

  // Actualizar rangos de precio cuando cambia el rango por defecto
  useEffect(() => {
    if (defaultPriceRange) {
      setFilters((prev) => ({
        ...prev,
        price_min: defaultPriceRange.min,
        price_max: defaultPriceRange.max,
      }));
    }
  }, [defaultPriceRange]);

  // Construir filtros para el backend (sin lógica de negocio, solo transformación)
  const backendFilters: ProductFilters = useMemo(() => {
    return {
      gender,
      brands: filters.brand,
      discount_min: calculateMinDiscount(filters.cyber_discount),
      price_min: filters.price_min,
      price_max: filters.price_max,
      attributes: Object.entries(filters)
        .filter(([key, value]) =>
          !['cyber_discount', 'brand', 'price_min', 'price_max'].includes(key) &&
          Array.isArray(value) &&
          value.length > 0
        )
        .reduce((acc, [key, value]) => {
          acc[key] = value as string[];
          return acc;
        }, {} as Record<string, string[]>),
    };
  }, [gender, filters]);

  // Actualizar un filtro específico
  const updateFilter = (filterKey: keyof FilterState, value: string[] | number) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Toggle un valor en un filtro de array
  const toggleFilterValue = (filterKey: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: (prev[filterKey] as string[]).includes(value)
        ? (prev[filterKey] as string[]).filter((v) => v !== value)
        : [...(prev[filterKey] as string[]), value],
    }));
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    const clearedFilters: FilterState = {
      cyber_discount: [],
      brand: [],
      price_min: defaultPriceRange?.min ?? 0,
      price_max: defaultPriceRange?.max ?? 999999,
    };

    setFilters(clearedFilters);
  };

  // Contar filtros activos (sin incluir valores por defecto)
  const activeFiltersCount = useMemo(() => {
    let count = filters.cyber_discount.length + filters.brand.length;

    // Contar filtro de precio si difiere de los valores por defecto
    const defaultMin = defaultPriceRange?.min ?? 0;
    const defaultMax = defaultPriceRange?.max ?? 999999;
    if (filters.price_min > defaultMin || filters.price_max < defaultMax) {
      count += 1;
    }

    return count;
  }, [filters, defaultPriceRange]);

  // Toggle sección de acordeón
  const toggleSection = (slug: string) => {
    setOpenSections((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return {
    filters,
    backendFilters,
    openSections,
    activeFiltersCount,
    updateFilter,
    toggleFilterValue,
    clearFilters,
    toggleSection,
  };
}
