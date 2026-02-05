/**
 * API Service - Cliente para API Gateway + Cognito
 * Reemplaza las llamadas directas a Supabase
 */

import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";

// URL de API Gateway (se actualizará después del deploy)
const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "https://your-api-id.execute-api.sa-east-1.amazonaws.com/dev";

// Feature flag: usar el proxy API/Lambda en lugar de llamadas directas a Supabase
export const USE_PROXY_API = (import.meta.env.VITE_USE_PROXY_API || "false").toLowerCase() === "true";

/**
 * Función helper para obtener la URL base del API
 */
export function getApiUrl(): string {
  return API_URL;
}

/**
 * Obtener JWT token de Cognito
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Hacer request a API Gateway
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, requireAuth: boolean = false): Promise<T> {
  const token = await getAuthToken();

  if (requireAuth && !token) {
    throw new Error("Authentication required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const errorData = (() => {
      try { return JSON.parse(errorText); } catch { return { error: response.statusText }; }
    })();
    throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return await response.json();
}

// ================================================================
// Products API
// ================================================================

export interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  sale_price?: number;
  discount_percentage?: number; // Calculado por el Lambda
  category_id?: string;
  brand_id?: string;
  stock_quantity?: number;
  image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  is_bestseller?: boolean;
  created_at?: string;

  // Atributos del producto
  frame_material?: string;
  lens_type?: string;
  frame_style?: string;
  gender?: string;

  // Relaciones expandidas por el Lambda
  brand?: {
    name: string;
  } | null;
  category?: {
    name: string;
  } | null;
  product_images?: Array<{
    url: string;
    alt_text: string | null;
    is_primary: boolean;
  }>;
}

export const productsApi = {
  /**
   * Obtener todos los productos (público - no requiere autenticación)
   */
  getPublic: async (): Promise<Product[]> => {
    return apiRequest<Product[]>("/public/products", {}, false);
  },

  /**
   * Obtener todos los productos (protegido - requiere autenticación)
   */
  list: async (): Promise<Product[]> => {
    return apiRequest<Product[]>("/products", {}, true);
  },

  /**
   * Obtener un producto por ID (público - no requiere autenticación)
   */
  get: async (id: string): Promise<Product> => {
    return apiRequest<Product>(`/public/products/${id}`, {}, false);
  },

  /**
   * Crear un producto (solo admin - requiere autenticación)
   */
  create: async (product: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(product),
      },
      true,
    );
  },

  /**
   * Actualizar un producto (solo admin - requiere autenticación)
   */
  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    return apiRequest<Product>(
      `/products/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(product),
      },
      true,
    );
  },

  /**
   * Eliminar un producto (solo admin - requiere autenticación)
   */
  delete: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/products/${id}`,
      {
        method: "DELETE",
      },
      true,
    );
  },
};

// ================================================================
// Orders API
// ================================================================

export interface OrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id?: string;
  email?: string;
  status: string;
  total_amount?: number;
  shipping_address?: string;
  order_items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export const ordersApi = {
  /**
   * Obtener todas las órdenes del usuario (o todas si es admin)
   */
  list: async (): Promise<Order[]> => {
    return apiRequest<Order[]>("/orders");
  },

  /**
   * Obtener una orden por ID
   */
  get: async (id: string): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}`);
  },

  /**
   * Crear una nueva orden
   */
  create: async (order: Partial<Order>): Promise<Order> => {
    return apiRequest<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },

  /**
   * Actualizar una orden
   */
  update: async (id: string, order: Partial<Order>): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    });
  },
};

// ================================================================
// Profile API
// ================================================================

export interface Profile {
  id?: string;
  cognito_id?: string;
  email?: string;
  full_name?: string;
  given_name?: string;
  family_name?: string;
  phone?: string;
  address?: Record<string, unknown>;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const profileApi = {
  /**
   * Obtener perfil del usuario actual
   */
  get: async (): Promise<Profile> => {
    return apiRequest<Profile>("/profile");
  },

  /**
   * Actualizar perfil del usuario actual
   */
  update: async (profile: Partial<Profile>): Promise<Profile> => {
    return apiRequest<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },
};

// ================================================================
// Brands API
// ================================================================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const brandsApi = {
  /**
   * Obtener todas las marcas (público - no requiere autenticación)
   */
  getPublic: async (): Promise<Brand[]> => {
    return apiRequest<Brand[]>("/public/brands", {}, false);
  },

  /**
   * Obtener todas las marcas (protegido - requiere autenticación)
   */
  list: async (): Promise<Brand[]> => {
    return apiRequest<Brand[]>("/brands", {}, true);
  },

  /**
   * Crear una nueva marca (solo admin - requiere autenticación)
   */
  create: async (brand: { name: string; slug?: string; description?: string }): Promise<Brand> => {
    return apiRequest<Brand>(
      "/brands",
      {
        method: "POST",
        body: JSON.stringify(brand),
      },
      true,
    );
  },

  /**
   * Verificar si una marca ya existe por nombre (público)
   */
  checkExists: async (name: string): Promise<boolean> => {
    const response = await apiRequest<{ exists: boolean }>(
      "/public/brands/check-exists",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
      false,
    );
    return response.exists;
  },
};

// ================================================================
// Helper para verificar si el usuario está autenticado
// ================================================================

export const checkAuth = async (): Promise<boolean> => {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
};

export default {
  products: productsApi,
  orders: ordersApi,
  profile: profileApi,
  brands: brandsApi,
  checkAuth,
  getApiUrl,
};
