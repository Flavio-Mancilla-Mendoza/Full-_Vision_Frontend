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
// Cart API
// ================================================================

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  prescription_details?: Record<string, unknown> | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CartItemWithProduct extends CartItem {
  product: Product | null;
}

export interface CartSummary {
  items: CartItemWithProduct[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export const cartApi = {
  /**
   * Obtener todos los items del carrito del usuario
   */
  list: async (): Promise<CartItemWithProduct[]> => {
    return apiRequest<CartItemWithProduct[]>("/cart", {}, true);
  },

  /**
   * Obtener resumen del carrito con totales calculados
   */
  getSummary: async (): Promise<CartSummary> => {
    return apiRequest<CartSummary>("/cart/summary", {}, true);
  },

  /**
   * Obtener contador de items en el carrito
   */
  getCount: async (): Promise<number> => {
    const response = await apiRequest<{ count: number }>("/cart/count", {}, true);
    return response.count;
  },

  /**
   * Agregar producto al carrito
   */
  add: async (data: {
    product_id: string;
    quantity: number;
    prescription_details?: Record<string, unknown> | null;
    special_instructions?: string | null;
  }): Promise<CartItemWithProduct> => {
    return apiRequest<CartItemWithProduct>(
      "/cart",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    );
  },

  /**
   * Actualizar cantidad de un item del carrito
   */
  updateQuantity: async (cartItemId: string, quantity: number): Promise<CartItemWithProduct> => {
    return apiRequest<CartItemWithProduct>(
      `/cart/${cartItemId}`,
      {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      },
      true,
    );
  },

  /**
   * Eliminar item del carrito
   */
  remove: async (cartItemId: string): Promise<void> => {
    await apiRequest<void>(
      `/cart/${cartItemId}`,
      {
        method: "DELETE",
      },
      true,
    );
  },

  /**
   * Vaciar todo el carrito
   */
  clear: async (): Promise<void> => {
    await apiRequest<void>(
      "/cart/all",
      {
        method: "DELETE",
      },
      true,
    );
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

// ================================================================
// Categories API
// ================================================================

export interface ProductCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const categoriesApi = {
  list: async (): Promise<ProductCategory[]> => {
    return apiRequest<ProductCategory[]>("/categories", {}, true);
  },
};

// ================================================================
// Locations API
// ================================================================

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  business_hours?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const locationsApi = {
  list: async (): Promise<Location[]> => {
    return apiRequest<Location[]>("/locations", {}, true);
  },
  create: async (data: Partial<Location>): Promise<Location> => {
    return apiRequest<Location>("/locations", { method: "POST", body: JSON.stringify(data) }, true);
  },
  update: async (id: string, data: Partial<Location>): Promise<Location> => {
    return apiRequest<Location>(`/locations/${id}`, { method: "PUT", body: JSON.stringify(data) }, true);
  },
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/locations/${id}`, { method: "DELETE" }, true);
  },
};

// ================================================================
// Appointments API
// ================================================================

export interface Appointment {
  id: string;
  user_id?: string;
  location_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  status?: string;
  exam_type?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  notes?: string;
  location?: Location | null;
  created_at?: string;
  updated_at?: string;
}

export const appointmentsApi = {
  list: async (): Promise<Appointment[]> => {
    return apiRequest<Appointment[]>("/appointments", {}, true);
  },
  create: async (data: Partial<Appointment>): Promise<Appointment> => {
    return apiRequest<Appointment>("/appointments", { method: "POST", body: JSON.stringify(data) }, true);
  },
  update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    return apiRequest<Appointment>(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }, true);
  },
};

// ================================================================
// Admin Profiles API
// ================================================================

export const adminProfilesApi = {
  list: async (): Promise<Profile[]> => {
    return apiRequest<Profile[]>("/admin/profiles", {}, true);
  },
  create: async (data: Partial<Profile>): Promise<Profile> => {
    return apiRequest<Profile>("/admin/profiles", { method: "POST", body: JSON.stringify(data) }, true);
  },
  update: async (id: string, data: Partial<Profile>): Promise<Profile> => {
    return apiRequest<Profile>(`/admin/profiles/${id}`, { method: "PUT", body: JSON.stringify(data) }, true);
  },
};

// ================================================================
// Product Images API
// ================================================================

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  s3_key?: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export const productImagesApi = {
  list: async (productId: string): Promise<ProductImage[]> => {
    return apiRequest<ProductImage[]>(`/admin/product-images?product_id=${productId}`, {}, true);
  },
  create: async (data: Partial<ProductImage>): Promise<ProductImage> => {
    return apiRequest<ProductImage>("/admin/product-images", { method: "POST", body: JSON.stringify(data) }, true);
  },
  update: async (imageId: string, data: Partial<ProductImage>): Promise<ProductImage> => {
    return apiRequest<ProductImage>(`/admin/product-images/${imageId}`, { method: "PUT", body: JSON.stringify(data) }, true);
  },
  delete: async (imageId: string): Promise<void> => {
    return apiRequest<void>(`/admin/product-images/${imageId}`, { method: "DELETE" }, true);
  },
  setPrimary: async (productId: string, imageId: string): Promise<void> => {
    return apiRequest<void>("/admin/product-images/primary", { method: "PUT", body: JSON.stringify({ product_id: productId, image_id: imageId }) }, true);
  },
};

export default {
  products: productsApi,
  orders: ordersApi,
  profile: profileApi,
  brands: brandsApi,
  cart: cartApi,
  categories: categoriesApi,
  locations: locationsApi,
  appointments: appointmentsApi,
  adminProfiles: adminProfilesApi,
  productImages: productImagesApi,
  checkAuth,
  getApiUrl,
};
