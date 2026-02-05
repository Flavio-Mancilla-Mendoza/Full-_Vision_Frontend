// src/services/admin/orders.ts - Gestión de órdenes (Admin)
import { supabase } from "@/lib/supabase";
import { parseDateInput } from "./helpers";
import type { Order, OrderStatus, PrescriptionDetails } from "@/types";

// Re-export types
export type { Order, OrderStatus };

/**
 * Obtener todas las órdenes con paginación
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
  let query = supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        product:products(
          name,
          sku,
          product_images(url, alt_text, is_primary)
        )
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.dateFrom) {
    const parsedDate = parseDateInput(filters.dateFrom);
    if (parsedDate) {
      const startOfDayUTC = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0, 0);
      query = query.gte("created_at", startOfDayUTC.toISOString());
    }
  }
  if (filters.dateTo) {
    const parsedDate = parseDateInput(filters.dateTo);
    if (parsedDate) {
      const endOfDayUTC = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
      query = query.lte("created_at", endOfDayUTC.toISOString());
    }
  }
  if (filters.search) {
    query = query.or(
      `order_number.ilike.%${filters.search}%,shipping_name.ilike.%${filters.search}%,shipping_email.ilike.%${filters.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []).map((order) => ({
      ...order,
      status: order.status as OrderStatus,
    })) as Order[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
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
 * Obtener órdenes de un usuario
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        product:products(
          *,
          product_images(*)
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((order) => ({
    ...order,
    status: order.status as OrderStatus,
  })) as Order[];
}

/**
 * Crear nueva orden
 */
export async function createOrder(orderData: Omit<Order, "id" | "created_at" | "updated_at" | "order_items">) {
  const { data, error } = await supabase.from("orders").insert([orderData]).select().single();

  if (error) throw error;
  return data;
}

/**
 * Actualizar estado de orden
 */
export async function updateOrderStatus(orderId: string, status: Order["status"], adminNotes?: string) {
  const updateData: Partial<Order> = { status };
  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  const { data, error } = await supabase.from("orders").update(updateData).eq("id", orderId).select().single();

  if (error) throw error;

  // Reactivar productos si la orden se cancela
  if (status === "cancelled") {
    console.log("🔓 Orden cancelada, reactivando productos...");

    const { data: orderItems, error: itemsError } = await supabase.from("order_items").select("product_id").eq("order_id", orderId);

    if (!itemsError && orderItems && orderItems.length > 0) {
      const productIds = orderItems.map((item) => item.product_id).filter((id): id is string => id !== null);

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
 * Crear orden desde el carrito
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
  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.sale_price || item.product?.base_price || 0;
    return sum + price * item.quantity;
  }, 0);

  const taxRate = 0.18;
  const taxAmount = subtotal * taxRate;
  const shippingAmount = subtotal >= 300 ? 0 : 25;
  const totalAmount = subtotal + taxAmount + shippingAmount;

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

  // Desactivar productos en la orden
  console.log("🔒 Desactivando productos en la orden...");
  const productIds = cartItems.map((item) => item.product_id).filter((id): id is string => id !== null);

  const { error: deactivateError } = await supabase
    .from("products")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .in("id", productIds);

  if (deactivateError) {
    console.error("⚠️ Error desactivando productos:", deactivateError);
  } else {
    console.log("✅ Productos desactivados temporalmente:", productIds.length);
  }

  // Limpiar el carrito
  const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", userId);

  if (clearError) throw clearError;

  return order;
}
