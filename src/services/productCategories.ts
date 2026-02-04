import { DbProduct } from "@/types";
import { normalizeProduct } from "@/lib/utils";
import api from "@/services/api";
import { IProduct } from "@/types/IProducts";

// Tipo para productos con marca básica desde Supabase join
export type ProductWithBrand = DbProduct & {
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

// Obtener filtros dinámicos basados en productos reales por género
export const getDynamicFiltersForGender = async (gender: string) => {
  try {
    console.log("🔍 getDynamicFiltersForGender - Buscando productos para:", gender);

    const response = await fetch(`${api.getApiUrl()}/public/filters/${gender}`);

    if (!response.ok) {
      console.error(`Error HTTP ${response.status} al obtener filtros para "${gender}"`);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Validación de estructura de datos
    if (!data || typeof data !== "object") {
      console.warn("Datos de filtros inválidos, usando valores por defecto");
      return {
        discounts: [],
        brands: [],
        priceRange: { min: 0, max: 1000 },
      };
    }

    console.log(`✅ Filtros obtenidos para "${gender}":`, data);

    // Asegurar estructura correcta con valores por defecto
    return {
      discounts: Array.isArray(data.discounts) ? data.discounts : [],
      brands: Array.isArray(data.brands) ? data.brands : [],
      priceRange: {
        min: data.priceRange?.min ?? 0,
        max: data.priceRange?.max ?? 1000,
      },
    };
  } catch (error) {
    console.error("Error fetching dynamic filters:", error);
    // Retornar valores seguros por defecto
    return {
      discounts: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
    };
  }
};

// Obtener productos por género con subcategorías y marcas
export const getProductsByGender = async (gender: string): Promise<IProduct[]> => {
  try {
    const response = await fetch(`${api.getApiUrl()}/public/products-by-gender/${gender}`);

    if (!response.ok) {
      const errorMsg = `Error HTTP ${response.status} al obtener productos para "${gender}"`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const data: IProduct[] = await response.json();

    console.log(data, "ESTOS SON LOS DATOS EN EL CALL");

    // Validación de estructura de datos
    if (!data || typeof data !== "object") {
      console.error("Estructura de datos inválida en respuesta de productos");
      throw new Error("Datos de productos inválidos");
    }

    console.log(`✅ Total productos encontrados para "${gender}":`, data.length);

    // Asegurar estructura correcta con valores por defecto
    return data;
  } catch (error) {
    console.error("Error fetching products by gender:", error);
    // Re-lanzar el error para que React Query lo maneje
    throw error instanceof Error ? error : new Error("Error desconocido al obtener productos");
  }
};
