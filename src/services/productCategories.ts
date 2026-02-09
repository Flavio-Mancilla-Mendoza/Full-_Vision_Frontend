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

// Interfaz para parámetros de filtrado
export interface ProductFilters {
  gender: string;
  brands?: string[];
  discount_min?: number;
  price_min?: number;
  price_max?: number;
  attributes?: Record<string, string[]>; // { frame_size: ['M', 'L'], frame_material: ['metal'] }
  sort_by?: 'featured' | 'price_asc' | 'price_desc' | 'discount';
  page?: number;
  limit?: number;
}

// Respuesta de productos con paginación
export interface ProductsResponse {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Construir query params desde filtros
function buildQueryParams(filters: ProductFilters): string {
  const params = new URLSearchParams();

  // Género (requerido)
  params.append('gender', filters.gender);

  // Marcas
  if (filters.brands && filters.brands.length > 0) {
    filters.brands.forEach(brand => params.append('brands[]', brand));
  }

  // Descuento mínimo
  if (filters.discount_min !== undefined && filters.discount_min > 0) {
    params.append('discount_min', filters.discount_min.toString());
  }

  // Rango de precio
  if (filters.price_min !== undefined && filters.price_min > 0) {
    params.append('price_min', filters.price_min.toString());
  }
  if (filters.price_max !== undefined && filters.price_max < 999999) {
    params.append('price_max', filters.price_max.toString());
  }

  // Atributos dinámicos
  if (filters.attributes) {
    Object.entries(filters.attributes).forEach(([key, values]) => {
      if (values.length > 0) {
        values.forEach(value => params.append(`attributes[${key}][]`, value));
      }
    });
  }

  // Ordenamiento
  if (filters.sort_by) {
    params.append('sort_by', filters.sort_by);
  }

  // Paginación
  params.append('page', (filters.page || 1).toString());
  params.append('limit', (filters.limit || 24).toString());

  return params.toString();
}

// Obtener filtros dinámicos basados en productos reales por género
export const getDynamicFiltersForGender = async (gender: string) => {
  try {
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

// Obtener productos por género con subcategorías y marcas (NUEVO: con filtros y paginación)
export const getProductsByGender = async (filters: ProductFilters): Promise<ProductsResponse> => {
  try {
    const queryString = buildQueryParams(filters);
    const response = await fetch(`${api.getApiUrl()}/public/products-by-gender?${queryString}`);

    if (!response.ok) {
      const errorMsg = `Error HTTP ${response.status} al obtener productos`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const data: ProductsResponse = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching products by gender:", error);
    throw error instanceof Error ? error : new Error("Error desconocido al obtener productos");
  }
};
