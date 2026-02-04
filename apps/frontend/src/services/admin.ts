// src/services/admin.ts - Adaptado para Full Vision (Óptica)
import { supabase } from "@/lib/supabase";
import * as api from "@/services/api";
import { getCurrentUserId } from "@/services/cognito-auth";
import {
  UserProfile as GlobalUserProfile,
  OpticalProduct as GlobalOpticalProduct,
  Order as GlobalOrder,
  OrderItem as GlobalOrderItem,
  UserRole,
  OrderStatus,
  PrescriptionDetails,
  ExamResults,
  DbProductImage as ProductImage,
  DbLocation,
  ProductCategory,
  Brand,
} from "@/types";
import type { Location } from "@/types/location";
import { Database } from "@/types/database";
import { generateSKU as clientGenerateSKU } from "@/lib/product-utils";

// ======================= USERS MANAGEMENT =======================

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

export type UserProfile = GlobalUserProfile;
export type OpticalProduct = GlobalOpticalProduct;
export type Order = GlobalOrder;
export type OrderItem = GlobalOrderItem;

// Función helper para parsear fechas en diferentes formatos
function parseDateInput(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string" || dateString.trim() === "") {
    return null;
  }

  const trimmed = dateString.trim();

  // Intentar parsear directamente con new Date() primero

  // Intentar parsear directamente con new Date() primero
  const directParse = new Date(trimmed);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  // Si ya está en formato YYYY-MM-DD o ISO, intentar parsear directamente
  if (trimmed.includes("-")) {
    // Verificar si es DD-MM-YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;

      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return null;
      }

      // Crear fecha usando Date.UTC para evitar problemas de zona horaria
      const utcDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
      return utcDate;
    }

    // Verificar si es YYYY-MM-DD
    const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;

      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return null;
      }

      const utcDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
      return utcDate;
    }
  }

  return null;
}

export type { ProductCategory, Brand } from "@/types";

export interface EyeExamAppointment {
  id: string;
  user_id: string;
  location_id: string;

  // Información de la cita
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  exam_type: "comprehensive" | "basic" | "contact_lens" | "follow_up";

  // Información del paciente
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;

  // Motivo y historial
  reason_for_visit?: string;
  has_insurance: boolean;
  insurance_provider?: string;
  current_prescription?: string;
  last_exam_date?: string;
  medical_conditions?: string;
  medications?: string;

  // Resultados
  exam_results?: ExamResults;
  prescription_issued?: PrescriptionDetails;
  recommendations?: string;

  // Seguimiento
  follow_up_needed: boolean;
  follow_up_date?: string;

  // Notas
  patient_notes?: string;
  doctor_notes?: string;

  // Relaciones
  location?: DbLocation;

  created_at: string;
  updated_at: string;
}

// Obtener todos los usuarios (solo admins)
export async function getAllUsers(): Promise<UserProfile[]> {
  // Admin service querying profiles table

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id, email, full_name, role, phone, is_active, 
        created_at, updated_at
      `,
      )
      .order("created_at", { ascending: false });

    // Query result processed

    if (error) {
      console.error("❌ Admin Service: Error en consulta:", error);
      // Agregar información más detallada del error
      throw new Error(`Error al consultar usuarios: ${error.message} (Código: ${error.code || "N/A"})`);
    }

    // Users found and processed
    return (data || []).map((user) => ({
      ...user,
      role: user.role as UserRole | null,
      email: user.email || null,
      full_name: user.full_name || null,
      phone: user.phone || null,
      is_active: user.is_active ?? false,
    })) as UserProfile[];
  } catch (error: unknown) {
    console.error("❌ Admin Service: Error crítico:", error);
    // Re-lanzar el error para que el componente lo pueda manejar
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al consultar usuarios");
  }
} // Crear usuario (admin)
// Obtener usuarios con paginación y filtros básicos
export async function getAllUsersPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string } = {},
): Promise<{ data: UserProfile[]; count: number; totalPages: number }> {
  let query = supabase
    .from("profiles")
    .select(`id, email, full_name, role, phone, is_active, created_at, updated_at`, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("Error fetching paginated users:", error);
    throw error;
  }

  const api = await import("./api");
  if (api.USE_PROXY_API) {
    try {
      const res = await fetch(`${api.getApiUrl()}/products/${productId}`);
      if (!res.ok) {
        return [];
      }
      const product = await res.json();
      return (product && product.product_images) || [];
    } catch (err) {
      console.error("Error fetching product images via API:", err);
      return getProductImagesInternal(productId);
    }
  }

  return getProductImagesInternal(productId);
}
// NOTA: Ahora usa AWS Cognito Admin API a través de Lambda
export async function createUser(userData: {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "customer";
  phone?: string;
}) {
  try {
    // Obtener la URL de la API Gateway desde las variables de entorno o configuración
    const apiUrl = process.env.REACT_APP_API_GATEWAY_URL || process.env.API_GATEWAY_URL;

    if (!apiUrl) {
      throw new Error("API Gateway URL no configurada");
    }

    // Obtener el access token de Cognito
    const { getAccessToken } = await import("@/services/cognito-auth");
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("No se pudo obtener el token de acceso. Inicia sesión nuevamente.");
    }

    // Llamar a la Lambda de admin user management
    const response = await fetch(`${apiUrl}/admin/users/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: "createUser",
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
    }

    if (!result.success) {
      throw new Error(result.error || "Error desconocido al crear usuario");
    }

    // Después de crear el usuario en Cognito, crear el perfil en Supabase
    // Esto es necesario porque Cognito maneja auth pero los perfiles están en Supabase
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: result.userSub, // El sub de Cognito como ID
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("❌ Error creando perfil en Supabase:", profileError);
      // No lanzamos error aquí porque el usuario ya se creó en Cognito
      // Podríamos implementar un sistema de reintento o notificación
    }

    return {
      success: true,
      user: profileData,
      message: "Usuario creado exitosamente",
    };
  } catch (error: unknown) {
    console.error("❌ Admin Service: Error creando usuario:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al crear usuario");
  }
}

// Actualizar usuario
export async function updateUser(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();

  if (error) throw error;
  return data;
}

// Eliminar usuario (deshabilitar)
export async function deactivateUser(userId: string) {
  const { data, error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId).select().single();

  if (error) throw error;
  return data;
}

// ======================= PRODUCTS MANAGEMENT (ÓPTICA) =======================

// Obtener todas las categorías
export async function getAllCategories(): Promise<ProductCategory[]> {
  const { data, error } = await supabase.from("product_categories").select("*").order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtener todas las marcas
export async function getAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Verificar si un SKU ya existe
export async function checkSKUExists(sku: string, excludeProductId?: string): Promise<boolean> {
  if (api.USE_PROXY_API) {
    try {
      const res = await fetch(`${api.getApiUrl()}/products/check-sku`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, excludeProductId }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      return !!json.exists;
    } catch (err) {
      console.error("Error checking SKU via API:", err);
      return false;
    }
  }

  // Legacy: check directly in Supabase
  let query = supabase.from("products").select("id").eq("sku", sku);

  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking SKU:", error);
    return false;
  }

  return data && data.length > 0;
}

// Verificar si un slug ya existe
export async function checkSlugExists(slug: string, excludeProductId?: string): Promise<boolean> {
  if (api.USE_PROXY_API) {
    try {
      const res = await fetch(`${api.getApiUrl()}/products/check-slug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, excludeProductId }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      return !!json.exists;
    } catch (err) {
      console.error("Error checking slug via API:", err);
      return false;
    }
  }

  // Legacy: check directly in Supabase
  let query = supabase.from("products").select("id").eq("slug", slug);

  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking slug:", error);
    return false;
  }

  return data && data.length > 0;
}

// Generate a unique SKU (will use proxy API if enabled, otherwise local generator + uniqueness check)
export async function generateProductSKU(opts: {
  name: string;
  frame_style?: string;
  frame_size?: string;
  excludeProductId?: string;
}): Promise<string> {
  const { name, frame_style, frame_size, excludeProductId } = opts;
  if (!name) throw new Error("name is required");

  if (api.USE_PROXY_API) {
    try {
      const response = await fetch(`${api.getApiUrl()}/products/generate-sku`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ name, frame_style, frame_size, excludeProductId }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }

      const json = await response.json();
      return json.sku;
    } catch (error) {
      console.error("Error generating SKU via API:", error);
      throw error;
    }
  }

  // Legacy: local generation + uniqueness check
  let sku = clientGenerateSKU(name, frame_style, frame_size);
  let attempts = 0;
  while (attempts < 5) {
    const exists = await checkSKUExists(sku, excludeProductId);
    if (!exists) break;
    attempts++;
    sku = clientGenerateSKU(name, frame_style, frame_size);
  }
  return sku;
}

// Obtener todos los productos (específicos para óptica)
export async function getAllOpticalProducts(): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(*)
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtener productos ópticos con paginación y filtros básicos
export async function getAllOpticalProductsPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string; brandId?: string; discounted?: boolean } = {},
): Promise<{ data: OpticalProduct[]; count: number; totalPages: number }> {
  let query = supabase
    .from("products")
    .select(
      `
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(*)
    `,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.brandId) {
    query = query.eq("brand_id", filters.brandId);
  }

  if (typeof filters.discounted === "boolean") {
    if (filters.discounted) query = query.gt("discount_percentage", 0);
    else query = query.eq("discount_percentage", 0);
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q},sku.ilike.${q},slug.ilike.${q}`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as OpticalProduct[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// Crear producto óptico
export async function createOpticalProduct(productData: Database["public"]["Tables"]["products"]["Insert"]) {
  if (api.USE_PROXY_API) {
    // Use API Gateway
    try {
      const response = await fetch(`${api.getApiUrl()}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating product via API:", error);
      throw error;
    }
  }

  // Legacy: direct Supabase insert
  const { data, error } = await supabase.from("products").insert([productData]).select().single();
  if (error) {
    console.error("Error creating product in Supabase:", error);
    throw error;
  }
  return data;
}

// Helper para obtener token
async function getAuthToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import("@aws-amplify/auth");
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

// Actualizar producto óptico
export async function updateOpticalProduct(productId: string, updates: Partial<OpticalProduct>) {
  if (api.USE_PROXY_API) {
    try {
      const response = await fetch(`${api.getApiUrl()}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating product via API:", error);
      throw error;
    }
  }

  // Legacy: direct Supabase update
  const { data, error } = await supabase.from("products").update(updates).eq("id", productId).select().single();
  if (error) throw error;
  return data;
}

// 🔒 Desactivar producto (marcar como reservado/vendido)
export async function deactivateProduct(productId: string, reason?: string) {
  console.log(`🔒 Desactivando producto: ${productId}`, reason ? `(${reason})` : "");

  const { data, error } = await supabase
    .from("products")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  console.log("✅ Producto desactivado");
  return data;
}

// 🔓 Reactivar producto (disponible nuevamente)
export async function reactivateProduct(productId: string) {
  console.log(`🔓 Reactivando producto: ${productId}`);

  const { data, error } = await supabase
    .from("products")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  console.log("✅ Producto reactivado");
  return data;
}

// 🔄 Reactivar todos los productos de una orden (útil si el pago falla)
export async function reactivateOrderProducts(orderId: string) {
  console.log(`🔄 Reactivando productos de la orden: ${orderId}`);

  // Obtener los productos de la orden
  const { data: orderItems, error: itemsError } = await supabase.from("order_items").select("product_id").eq("order_id", orderId);

  if (itemsError) throw itemsError;

  if (!orderItems || orderItems.length === 0) {
    console.log("⚠️ No hay productos en esta orden");
    return;
  }

  const productIds = orderItems.map((item) => item.product_id);

  const { error: reactivateError } = await supabase
    .from("products")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .in("id", productIds);

  if (reactivateError) throw reactivateError;

  console.log(`✅ ${productIds.length} productos reactivados`);
  return productIds;
}

// Obtener imágenes de un producto (necesaria para deleteOpticalProduct)
async function getProductImagesInternal(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Eliminar producto
export async function deleteOpticalProduct(productId: string) {
  if (api.USE_PROXY_API) {
    // Use API Gateway
    try {
      const response = await fetch(`${api.getApiUrl()}/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // DELETE returns 204 No Content, no body to parse
      return { success: true };
    } catch (error) {
      console.error("Error deleting product via API:", error);
      throw error;
    }
  }

  // Legacy: direct Supabase delete
  try {
    // 1. Obtener las imágenes del producto antes de eliminarlo
    console.log("🔍 Obteniendo imágenes del producto:", productId);
    const images = await getProductImagesInternal(productId);
    console.log("📸 Imágenes encontradas:", images.length);

    // 2. Eliminar el producto (esto eliminará las imágenes de la BD por CASCADE)
    console.log("🗑️ Eliminando producto de la BD:", productId);
    const { data, error } = await supabase.from("products").delete().eq("id", productId).select().single();

    if (error) throw error;

    // 3. Eliminar las imágenes del Storage (si existen)
    if (images && images.length > 0) {
      console.log("🗑️ Eliminando", images.length, "imágenes del Storage...");
      for (const image of images) {
        if (image.url) {
          try {
            await deleteProductImageFromStorage(image.url);
          } catch (err) {
            console.warn("Error eliminando imagen del storage:", err);
            // Continuar con las demás imágenes
          }
        }
      }
      console.log("✅ Imágenes eliminadas del Storage");
    }

    console.log("✅ Producto eliminado completamente:", productId);
    return data;
  } catch (error) {
    console.error("❌ Error eliminando producto:", error);
    throw error;
  }
}

// ======================= ORDERS MANAGEMENT =======================

// Obtener todas las órdenes con paginación
export async function getAllOrdersPaginated(
  page = 1,
  limit = 50,
  filters: {
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {},
): Promise<{ data: Order[]; count: number; totalPages: number }> {
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      order_items(
        *,
        product:products(
          name,
          sku,
          product_images(url, alt_text, is_primary)
        )
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  // Aplicar filtros
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.dateFrom) {
    // Parsear la fecha en formato DD-MM-YYYY o YYYY-MM-DD
    const parsedDate = parseDateInput(filters.dateFrom);
    if (parsedDate) {
      // parsedDate ya viene en UTC, crear rango para todo el día
      const startOfDayUTC = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0, 0);
      query = query.gte("created_at", startOfDayUTC.toISOString());
    }
  }
  if (filters.dateTo) {
    // Parsear la fecha en formato DD-MM-YYYY o YYYY-MM-DD
    const parsedDate = parseDateInput(filters.dateTo);
    if (parsedDate) {
      // parsedDate ya viene en UTC, crear rango para todo el día
      const endOfDayUTC = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
      query = query.lte("created_at", endOfDayUTC.toISOString());
    }
  }
  if (filters.search) {
    query = query.or(
      `order_number.ilike.%${filters.search}%,shipping_name.ilike.%${filters.search}%,shipping_email.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const result = {
    data: (data || []).map((order) => ({
      ...order,
      status: order.status as OrderStatus,
    })) as Order[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };

  return result;
}

// Obtener todas las órdenes (versión legacy para compatibilidad)
export async function getAllOrders(): Promise<Order[]> {
  const { data } = await getAllOrdersPaginated(1, 1000); // Máximo 1000 para evitar problemas
  return data;
}

// Obtener órdenes de un usuario
export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items(
        *,
        product:products(
          *,
          product_images(*)
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((order) => ({
    ...order,
    status: order.status as OrderStatus,
  })) as Order[];
}

// Crear nueva orden
export async function createOrder(orderData: Omit<Order, "id" | "created_at" | "updated_at" | "order_items">) {
  const { data, error } = await supabase.from("orders").insert([orderData]).select().single();

  if (error) throw error;
  return data;
}

// Actualizar estado de orden
export async function updateOrderStatus(orderId: string, status: Order["status"], adminNotes?: string) {
  const updateData: Partial<Order> = { status };
  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  const { data, error } = await supabase.from("orders").update(updateData).eq("id", orderId).select().single();

  if (error) throw error;

  // 🔓 REACTIVAR PRODUCTOS si la orden se cancela
  if (status === "cancelled") {
    console.log("🔓 Orden cancelada, reactivando productos...");

    // Obtener los productos de la orden
    const { data: orderItems, error: itemsError } = await supabase.from("order_items").select("product_id").eq("order_id", orderId);

    if (!itemsError && orderItems && orderItems.length > 0) {
      const productIds = orderItems.map((item) => item.product_id);

      const { error: reactivateError } = await supabase
        .from("products")
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .in("id", productIds);

      if (reactivateError) {
        console.error("⚠️ Error reactivando productos:", reactivateError);
      } else {
        console.log("✅ Productos reactivados:", productIds.length);
      }
    }
  }

  return data;
}

// Generar número de orden único
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `FV${year}${month}${day}-${random}`;
}

// Interface para items del carrito con producto
interface CartItemForOrder {
  product_id: string;
  quantity: number;
  product?: {
    base_price?: number;
    sale_price?: number;
  } | null;
  prescription_details?: PrescriptionDetails | null;
  special_instructions?: string | null;
}

// Crear orden desde el carrito
export async function createOrderFromCart(
  userId: string,
  cartItems: CartItemForOrder[],
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    dni?: string;
  },
  paymentMethod: string,
  customerNotes?: string,
) {
  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.sale_price || item.product?.base_price || 0;
    return sum + price * item.quantity;
  }, 0);

  const taxRate = 0.18; // 18% IGV
  const taxAmount = subtotal * taxRate;
  const shippingAmount = subtotal >= 300 ? 0 : 25;
  const totalAmount = subtotal + taxAmount + shippingAmount;

  // Generar número de orden
  const orderNumber = await generateOrderNumber();

  // Crear la orden
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        order_number: orderNumber,
        status: "pending",
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        shipping_name: shippingInfo.name,
        shipping_email: shippingInfo.email,
        shipping_phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_postal_code: shippingInfo.postal_code,
        customer_dni: shippingInfo.dni || null,
        billing_name: shippingInfo.name,
        billing_email: shippingInfo.email,
        customer_notes: customerNotes || null,
        admin_notes: `Método de pago: ${paymentMethod}`,
      },
    ])
    .select()
    .single();

  if (orderError) throw orderError;

  // Crear los items de la orden
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.product?.sale_price || item.product?.base_price || 0,
    total_price: (item.product?.sale_price || item.product?.base_price || 0) * item.quantity,
    prescription_details: item.prescription_details || null,
    special_instructions: item.special_instructions || null,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) throw itemsError;

  // 🔒 DESACTIVAR PRODUCTOS EN LA ORDEN (productos únicos - reservados hasta confirmar pago)
  console.log("🔒 Desactivando productos en la orden...");
  const productIds = cartItems.map((item) => item.product_id);

  const { error: deactivateError } = await supabase
    .from("products")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .in("id", productIds);

  if (deactivateError) {
    console.error("⚠️ Error desactivando productos:", deactivateError);
    // No lanzar error, la orden ya se creó
  } else {
    console.log("✅ Productos desactivados temporalmente:", productIds.length);
  }

  // Limpiar el carrito del usuario
  const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", userId);

  if (clearError) throw clearError;

  return order;
}

// ======================= EYE EXAM APPOINTMENTS =======================

// Obtener todas las citas
export async function getAllEyeExamAppointments(): Promise<EyeExamAppointment[]> {
  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .select(
      `
      *,
      location:eye_exam_locations(*)
    `,
    )
    .order("appointment_date", { ascending: false });

  if (error) throw error;
  return (data || []).map((appointment) => ({
    ...appointment,
    exam_type: appointment.exam_type as "comprehensive" | "basic" | "contact_lens" | "follow_up",
    exam_results: appointment.exam_results as ExamResults,
    prescription_issued: appointment.prescription_issued as PrescriptionDetails,
  }));
}

// Crear nueva cita
export async function createEyeExamAppointment(appointmentData: Omit<EyeExamAppointment, "id" | "created_at" | "updated_at" | "location">) {
  const { data, error } = await supabase.from("eye_exam_appointments").insert([appointmentData]).select().single();

  if (error) throw error;
  return data;
}

// Actualizar cita
export async function updateEyeExamAppointment(appointmentId: string, updates: Partial<EyeExamAppointment>) {
  const { data, error } = await supabase.from("eye_exam_appointments").update(updates).eq("id", appointmentId).select().single();

  if (error) throw error;
  return data;
}

// ======================= ANALYTICS & REPORTS =======================

export interface DashboardStats {
  // Estadísticas básicas
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalAppointments: number;
  totalLocations: number;
  recentOrders: number;
  recentAppointments: number;
  activeUsers: number;

  // Estadísticas financieras
  totalRevenue: number;
  averageOrderValue: number;

  // Estadísticas específicas de óptica
  productsByCategory: { category: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  topSellingProducts: { name: string; quantity: number }[];
}

// Obtener estadísticas completas del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const [users, products, orders, appointments, locations, recentOrders, recentAppointments] = await Promise.all([
    supabase.from("profiles").select("id, is_active", { count: "exact" }),
    supabase.from("products").select("id", { count: "exact" }),
    supabase.from("orders").select("id, total_amount", { count: "exact" }),
    supabase.from("eye_exam_appointments").select("id", { count: "exact" }),
    supabase.from("eye_exam_locations").select("id", { count: "exact" }),
    supabase
      .from("orders")
      .select("id, total_amount")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("eye_exam_appointments")
      .select("id")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Calcular métricas financieras
  const totalRevenue = orders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const averageOrderValue = orders.count ? totalRevenue / orders.count : 0;
  const activeUsers = users.data?.filter((user) => user.is_active).length || 0;

  return {
    // Básicas
    totalUsers: users.count || 0,
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalAppointments: appointments.count || 0,
    totalLocations: locations.count || 0,
    recentOrders: recentOrders.data?.length || 0,
    recentAppointments: recentAppointments.data?.length || 0,
    activeUsers,

    // Financieras
    totalRevenue,
    averageOrderValue,

    // Específicas (implementar gradualmente)
    productsByCategory: [],
    ordersByStatus: [],
    appointmentsByStatus: [],
    topSellingProducts: [],
  };
}

// ======================= LOCATIONS MANAGEMENT =======================

// Obtener todas las ubicaciones
export async function getAllLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from("eye_exam_locations").select("*").order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtener ubicaciones con paginación y filtros básicos
export async function getAllLocationsPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string } = {},
): Promise<{ data: Location[]; count: number; totalPages: number }> {
  let query = supabase
    .from("eye_exam_locations")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},address.ilike.${q},city.ilike.${q}`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as Location[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// Crear ubicación
export async function createLocation(locationData: Omit<Location, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("eye_exam_locations").insert([locationData]).select().single();

  if (error) throw error;
  return data;
}

// Actualizar ubicación
export async function updateLocation(locationId: string, updates: Partial<Location>) {
  const { data, error } = await supabase.from("eye_exam_locations").update(updates).eq("id", locationId).select().single();

  if (error) throw error;
  return data;
}

// Verificar si una ubicación tiene citas asociadas
export async function checkLocationHasAppointments(locationId: string): Promise<boolean> {
  const { data, error } = await supabase.from("eye_exam_appointments").select("id").eq("location_id", locationId).limit(1);

  if (error) throw error;
  return (data?.length || 0) > 0;
}

// Eliminar ubicación
export async function deleteLocation(locationId: string) {
  // Primero verificar si tiene citas asociadas
  const hasAppointments = await checkLocationHasAppointments(locationId);

  if (hasAppointments) {
    throw new Error("No se puede eliminar la ubicación porque tiene citas asociadas. Puedes desactivarla en su lugar.");
  }

  const { data, error } = await supabase.from("eye_exam_locations").delete().eq("id", locationId).select().single();

  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar la ubicación porque tiene citas asociadas. Puedes desactivarla en su lugar.");
    }
    throw error;
  }
  return data;
}

// Verificar si el usuario actual es admin
export async function isAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();

  return profile?.role === "admin";
}

// ======================= STORAGE MANAGEMENT =======================

/**
 * Subir imagen a S3 usando presigned URL
 * @param file - Archivo a subir
 * @param productId - ID del producto (opcional)
 * @returns Objeto con s3Key y URL de la imagen
 */
export async function uploadProductImage(file: File, productId?: string): Promise<{ s3Key: string; url: string }> {
  const api = await import("./api");

  try {
    // 1. Solicitar presigned URL al Lambda
    const response = await fetch(`${api.getApiUrl()}/products/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const { uploadUrl, s3Key } = await response.json();

    // 2. Subir archivo directamente a S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to S3: ${uploadResponse.status}`);
    }

    // 3. Construir URL pública de S3
    const bucket = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    console.log("✅ Imagen subida a S3:", { s3Key, url: publicUrl });

    return {
      s3Key,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}

/**
 * Eliminar imagen de S3 (por ahora solo log - implementar endpoint DELETE en Lambda si necesario)
 * @param s3Key - Key de S3 a eliminar
 */
export async function deleteProductImageFromS3(s3Key: string): Promise<void> {
  try {
    console.log("🗑️ Eliminando imagen de S3:", s3Key);
    // TODO: Implementar endpoint DELETE en Lambda si se requiere eliminación física
    // Por ahora solo eliminamos el registro de la base de datos
    console.warn("⚠️ Eliminación física de S3 no implementada. Solo se elimina registro de BD.");
  } catch (error) {
    console.warn("Error en deleteProductImageFromS3:", error);
    // No lanzar error para no bloquear la eliminación del producto
  }
}

// Mantener función legacy para compatibilidad con URLs de Supabase
export async function deleteProductImageFromStorage(imageUrl: string): Promise<void> {
  try {
    // Detectar si es URL de S3 o Supabase
    if (imageUrl.includes(".s3.") || imageUrl.includes("amazonaws.com")) {
      // Es S3 - extraer s3Key
      const match = imageUrl.match(/\/products\/(.+)$/);
      if (match) {
        const s3Key = `products/${match[1]}`;
        await deleteProductImageFromS3(s3Key);
      }
    } else {
      // Es Supabase legacy - mantener lógica anterior
      const urlParts = imageUrl.split("/storage/v1/object/public/products/");
      if (urlParts.length === 2) {
        console.warn("⚠️ Imagen legacy de Supabase Storage. No se eliminará físicamente.");
      }
    }
  } catch (error) {
    console.warn("Error en deleteProductImageFromStorage:", error);
  }
}

// Crear registro de imagen en la base de datos
export async function createProductImageRecord(
  productId: string,
  imageData: {
    url: string;
    s3_key?: string;
    alt_text?: string;
    sort_order: number;
    is_primary: boolean;
  },
): Promise<ProductImage> {
  const { data, error } = await supabase
    .from("product_images")
    .insert([
      {
        product_id: productId,
        url: imageData.url,
        s3_key: imageData.s3_key,
        alt_text: imageData.alt_text,
        sort_order: imageData.sort_order,
        is_primary: imageData.is_primary,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar imagen en la base de datos
export async function updateProductImageRecord(
  imageId: string,
  updates: {
    url?: string;
    s3_key?: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  },
): Promise<ProductImage> {
  const { data, error } = await supabase.from("product_images").update(updates).eq("id", imageId).select().single();

  if (error) throw error;
  return data;
}

// Eliminar imagen de la base de datos
export async function deleteProductImageRecord(imageId: string): Promise<void> {
  const { data, error } = await supabase.from("product_images").delete().eq("id", imageId).select().single();

  if (error) throw error;

  // Si la imagen tenía URL de storage, eliminarla también
  if (data && data.url) {
    try {
      await deleteProductImageFromStorage(data.url);
    } catch (error) {
      console.warn("Error eliminando imagen del storage:", error);
    }
  }
}

// Obtener imágenes de un producto
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  try {
    const api = await import("./api");
    const res = await fetch(`${api.getApiUrl()}/products/${productId}`);
    if (!res.ok) return [];
    const product = await res.json();
    return (product && product.product_images) || [];
  } catch (err) {
    console.error("Error fetching product images via API:", err);
    return getProductImagesInternal(productId);
  }
}

// Configurar imagen como principal (y desmarcar las demás)
export async function setProductPrimaryImage(productId: string, imageId: string): Promise<void> {
  // Primero desmarcar todas las imágenes como no principales
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);

  // Luego marcar la seleccionada como principal
  const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);

  if (error) throw error;
}

// ======================= FIX BROKEN IMAGE URLS =======================

/**
 * Corregir URLs de imágenes que están guardadas como claves de S3 en lugar de URLs completas
 * Esto arregla el problema donde las imágenes devuelven HTML en lugar de la imagen
 */
export async function fixBrokenImageUrls(): Promise<{ fixed: number; errors: number }> {
  console.log("🔧 Iniciando corrección de URLs de imágenes rotas...");

  try {
    // Obtener todas las imágenes que podrían tener URLs rotas
    const { data: images, error } = await supabase.from("product_images").select("id, url, s3_key").not("url", "is", null);

    if (error) throw error;

    if (!images || images.length === 0) {
      console.log("✅ No hay imágenes para corregir");
      return { fixed: 0, errors: 0 };
    }

    console.log(`🔍 Revisando ${images.length} imágenes...`);

    let fixed = 0;
    let errors = 0;

    const bucket = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";
    const cloudFrontUrl = import.meta.env.VITE_IMAGES_BASE_URL;

    if (!bucket) {
      throw new Error("VITE_AWS_S3_IMAGES_BUCKET no está configurado");
    }

    if (!cloudFrontUrl) {
      throw new Error("VITE_IMAGES_BASE_URL (CloudFront) no está configurado");
    }

    for (const image of images) {
      try {
        let needsFix = false;
        let correctedUrl = image.url;
        let correctedS3Key = image.s3_key;

        // Extraer la clave de S3 de la URL actual
        const extractS3Key = (url: string): string | null => {
          try {
            // Patrón para URLs de S3
            const s3Pattern = /https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/;
            const s3Match = url.match(s3Pattern);
            if (s3Match) return s3Match[1];

            // Patrón para CloudFront
            if (url.startsWith(cloudFrontUrl)) {
              return url.replace(cloudFrontUrl + "/", "");
            }

            // Si ya es solo la key
            if (!url.startsWith("http")) {
              return url;
            }

            return null;
          } catch (error) {
            return null;
          }
        };

        const s3Key = extractS3Key(image.url);

        if (s3Key) {
          // Construir URL de CloudFront con conversión a WebP
          const baseUrl = `${cloudFrontUrl}/${s3Key}`;
          const params = new URLSearchParams();

          // Convertir a WebP si no es ya WebP
          if (!s3Key.toLowerCase().endsWith(".webp")) {
            params.set("format", "webp");
          }

          correctedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
          correctedS3Key = s3Key;

          // Verificar si la URL actual es diferente
          if (correctedUrl !== image.url) {
            needsFix = true;
            console.log(`🔧 Corrigiendo URL: ${image.url} → ${correctedUrl}`);
          }
        } else {
          // Caso: URL es solo una clave de S3 (no contiene http)
          if (!image.url.startsWith("http") && !image.url.startsWith("//")) {
            needsFix = true;
            const s3Key = image.url;
            const baseUrl = `${cloudFrontUrl}/${s3Key}`;
            const params = new URLSearchParams();

            // Convertir a WebP
            if (!s3Key.toLowerCase().endsWith(".webp")) {
              params.set("format", "webp");
            }

            correctedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
            correctedS3Key = s3Key;
            console.log(`🔧 Corrigiendo URL incompleta: ${image.url} → ${correctedUrl}`);
          }
        }

        if (needsFix) {
          const { error: updateError } = await supabase
            .from("product_images")
            .update({
              url: correctedUrl,
              s3_key: correctedS3Key,
              updated_at: new Date().toISOString(),
            })
            .eq("id", image.id);

          if (updateError) {
            console.error(`❌ Error actualizando imagen ${image.id}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Imagen ${image.id} corregida`);
            fixed++;
          }
        }
      } catch (imageError) {
        console.error(`❌ Error procesando imagen ${image.id}:`, imageError);
        errors++;
      }
    }

    console.log(`🎉 Corrección completada: ${fixed} imágenes corregidas, ${errors} errores`);
    return { fixed, errors };
  } catch (error) {
    console.error("❌ Error en fixBrokenImageUrls:", error);
    throw error;
  }
}

// ======================= FEATURED PRODUCTS MANAGEMENT =======================

// Obtener productos destacados
export async function getFeaturedProducts(): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(id, product_id, url, s3_key, alt_text, sort_order, is_primary, created_at)
    `,
    )
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(8); // Máximo 8 productos destacados

  if (error) throw error;

  // Filtrar para incluir solo la imagen principal de cada producto
  const processedData =
    data?.map((product) => ({
      ...product,
      product_images: product.product_images?.filter((img) => img.is_primary) || [],
    })) || [];

  return processedData;
}

// Marcar producto como destacado
export async function setProductAsFeatured(productId: string, featured: boolean = true) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener productos disponibles para destacar (no destacados actualmente)
export async function getAvailableProductsForFeatured(): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(id, product_id, url, s3_key, alt_text, sort_order, is_primary, created_at)
    `,
    )
    .eq("is_featured", false)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  // Filtrar para incluir solo la imagen principal de cada producto
  const processedData =
    data?.map((product) => ({
      ...product,
      product_images: product.product_images?.filter((img) => img.is_primary) || [],
    })) || [];

  return processedData;
}

// ======================= BEST SELLERS MANAGEMENT =======================

// Interface para datos de ventas con producto relacionado
interface SalesDataItem {
  product_id: string;
  quantity: number;
  products: OpticalProduct;
}

// Obtener productos más vendidos (con simulación si no hay ventas reales)
export async function getBestSellingProducts(limit: number = 10): Promise<OpticalProduct[]> {
  // Query para obtener productos más vendidos basado en order_items
  const { data: salesData, error: salesError } = await supabase
    .from("order_items")
    .select(
      `
      product_id,
      quantity,
      products!inner(
        *,
        category:product_categories(*),
        brand:brands(*),
        product_images(*)
      )
    `,
    )
    .eq("products.is_active", true);

  if (salesError) {
    console.error("Error fetching sales data:", salesError);
  }

  // Si tenemos datos de ventas reales, calcular los más vendidos
  if (salesData && salesData.length > 0) {
    // Agrupar por producto y sumar cantidades
    const productSales: Record<string, { product: OpticalProduct; totalSold: number }> = {};

    salesData.forEach((item) => {
      const productId = item.product_id;
      // Verificar que el producto existe y tiene los datos necesarios
      if (item.products && productId && typeof item.products === "object" && !Array.isArray(item.products)) {
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.products as OpticalProduct,
            totalSold: 0,
          };
        }
        productSales[productId].totalSold += Number(item.quantity) || 0;
      }
    });

    // Ordenar por cantidad vendida y tomar los primeros
    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)
      .map((item) => item.product);

    return sortedProducts;
  }

  // Si no hay ventas reales, simular con productos populares
  // (basado en diferentes criterios como precio, categoría, etc.)
  return await simulateBestSellers(limit);
}

// Función auxiliar para simular best sellers cuando no hay datos de ventas
async function simulateBestSellers(limit: number): Promise<OpticalProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      category:product_categories(*),
      brand:brands(*),
      product_images(*)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false }) // Productos más recientes
    .limit(limit * 2); // Obtener más para poder simular variedad

  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Algoritmo de simulación para determinar "best sellers"
  const productsWithScore = data.map((product) => {
    let score = 0;

    // Puntos por ser bestseller marcado manualmente
    if (product.is_bestseller) score += 100;

    // Puntos por precio (productos en rango medio suelen venderse más)
    const price = product.base_price;
    if (price >= 100 && price <= 200) score += 50;
    else if (price >= 80 && price <= 100) score += 40;
    else if (price >= 200 && price <= 300) score += 30;

    // Puntos por categoría popular (lentes graduados y de sol)
    if (product.lens_type === "graduado") score += 60;
    else if (product.lens_type === "solar") score += 50;
    else if (product.lens_type === "filtro-azul") score += 40;

    // Puntos por género (unisex suele vender más)
    if (product.gender === "unisex") score += 30;
    else if (product.gender === "mujer") score += 25;
    else if (product.gender === "hombre") score += 20;

    // Puntos por tener descuento
    if (product.discount_percentage > 0) score += 20;

    // Puntos por tener imagen
    if (product.product_images && product.product_images.length > 0) score += 15;

    // Puntos aleatorios para variedad (simula preferencias de clientes)
    score += Math.random() * 25;

    return { ...product, simulatedScore: score };
  });

  // Ordenar por score y tomar los primeros
  return productsWithScore
    .sort((a, b) => b.simulatedScore - a.simulatedScore)
    .slice(0, limit)
    .map(({ simulatedScore, ...product }) => product); // Remover el score del resultado
}
