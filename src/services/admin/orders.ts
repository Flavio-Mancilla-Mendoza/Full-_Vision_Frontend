// src/services/admin/orders.ts - Gestión de órdenes (Admin)
// Migrado a API Gateway — ya NO llama a Supabase directamente
import { ordersApi } from "@/services/api";
import { getApiUrl } from "@/services/api";
import { parseDateInput } from "./helpers";
import { getAuthToken } from "./helpers";
import type { Order, OrderStatus, PrescriptionDetails } from "@/types";

// Re-export types
export type { Order, OrderStatus };

/**
 * Obtener todas las órdenes con paginación (vía API Gateway)
 * El Lambda devuelve todas las órdenes para admin; paginación/filtros se aplican client-side.
 */
export async function getAllOrdersPaginated(
  page = 1,
  limit = 50,
  filters: {
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {}
): Promise<{ data: Order[]; count: number; totalPages: number }> {
  // Obtener todas las órdenes via API Gateway (el Lambda filtra por admin/user)
  const allOrders = (await ordersApi.list()) as unknown as Order[];

  // Aplicar filtros client-side
  let filtered = allOrders;

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((o) => o.status === filters.status);
  }
  if (filters.userId) {
    filtered = filtered.filter((o) => o.user_id === filters.userId);
  }
  if (filters.dateFrom) {
    const parsedDate = parseDateInput(filters.dateFrom);
    if (parsedDate) {
      const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0, 0);
      filtered = filtered.filter((o) => o.created_at && new Date(o.created_at) >= startOfDay);
    }
  }
  if (filters.dateTo) {
    const parsedDate = parseDateInput(filters.dateTo);
    if (parsedDate) {
      const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
      filtered = filtered.filter((o) => o.created_at && new Date(o.created_at) <= endOfDay);
    }
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter((o) =>
      (o.order_number && o.order_number.toLowerCase().includes(search)) ||
      (o.shipping_name && o.shipping_name.toLowerCase().includes(search)) ||
      (o.shipping_email && o.shipping_email.toLowerCase().includes(search))
    );
  }

  // Ordenar por fecha descendente
  filtered.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // Paginación client-side
  const count = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return {
    data: paged.map((order) => ({
      ...order,
      status: order.status as OrderStatus,
    })),
    count,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Obtener todas las órdenes (versión legacy)
 */
export async function getAllOrders(): Promise<Order[]> {
  const { data } = await getAllOrdersPaginated(1, 1000);
  return data;
}

/**
 * Obtener órdenes de un usuario (vía API Gateway)
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  // La API Gateway devuelve todas las órdenes (para admin).
  // Filtramos por userId client-side.
  const allOrders = (await ordersApi.list()) as unknown as Order[];
  const userOrders = allOrders.filter((o) => o.user_id === userId);
  userOrders.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  return userOrders.map((order) => ({
    ...order,
    status: order.status as OrderStatus,
  }));
}

/**
 * Crear nueva orden (vía API Gateway)
 */
export async function createOrder(orderData: Omit<Order, "id" | "created_at" | "updated_at" | "order_items">) {
  return (await ordersApi.create(orderData as Partial<Order>)) as unknown as Order;
}

/**
 * Actualizar estado de orden (vía API Gateway)
 */
export async function updateOrderStatus(orderId: string, status: Order["status"], adminNotes?: string) {
  const updateData: Record<string, unknown> = { status };
  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  const updated = (await ordersApi.update(orderId, updateData as Partial<Order>)) as unknown as Order;
  return updated;
}

/**
 * Generar número de orden único
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");

  return `FV${year}${month}${day}-${random}`;
}

// Interface para items del carrito
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

/**
 * Crear orden desde el carrito (vía API Gateway /orders/checkout)
 * Los precios se calculan server-side; nunca se confía en precios del frontend.
 */
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
  customerNotes?: string
) {
  const token = await getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${getApiUrl()}/orders/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        prescription_details: item.prescription_details || null,
        special_instructions: item.special_instructions || null,
      })),
      shippingInfo,
      paymentMethod,
      customerNotes: customerNotes || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error creating order: ${response.status}`);
  }

  return response.json();
}
