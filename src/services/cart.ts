// src/services/cart.ts - Servicio para manejar carrito de compras
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/cognito-auth";
import { OpticalProduct, CartItemWithProduct, PrescriptionDetails, DbCartItem, DbCartItemInsert, DbCartItemUpdate } from "@/types";

export interface CartItem extends DbCartItem {
  prescription_details: PrescriptionDetails | null;
}

export interface CartItemWithProductLocal extends CartItemWithProduct {
  prescription_details: PrescriptionDetails | null;
}

export interface AddToCartData {
  user_id: string;
  product_id: string;
  quantity: number;
  prescription_details?: PrescriptionDetails | null;
  special_instructions?: string | null;
}

export interface CartSummary {
  items: CartItemWithProductLocal[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

// ======================= FUNCIONES AUXILIARES =======================

/**
 * Función optimizada para obtener carrito sin JOIN complejo
 */
async function getCartItemsSimple(userId: string): Promise<CartItemWithProductLocal[]> {
  if (!userId) {
    const cognitoUserId = await getCurrentUserId();
    if (!cognitoUserId) return [];
    userId = cognitoUserId;
  }

  try {
    // Solo obtener cart_items
    const { data: cartItems, error: cartError } = await supabase.from("cart_items").select("*").eq("user_id", userId);

    if (cartError) {
      console.error("Error fetching cart items:", cartError);
      return [];
    }

    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Obtener productos separadamente con sus imágenes
    const productIds = cartItems.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabase.from("products").select("*, product_images(*)").in("id", productIds);

    if (productsError) {
      console.warn("Error fetching products:", productsError);
      return cartItems.map((cartItem) => ({
        ...cartItem,
        product: null,
        prescription_details: cartItem.prescription_details as PrescriptionDetails | null,
      })) as CartItemWithProductLocal[];
    }

    // Combinar datos manualmente
    const result = cartItems.map((cartItem) => ({
      ...cartItem,
      product: products?.find((p) => p.id === cartItem.product_id),
      prescription_details: cartItem.prescription_details as PrescriptionDetails | null,
    })) as CartItemWithProductLocal[];

    return result;
  } catch (error) {
    console.error("Error en getCartItemsSimple:", error);
    return [];
  }
}

// ======================= OPERACIONES DEL CARRITO =======================

/**
 * Obtener todos los items del carrito del usuario
 */
export async function getCartItems(userId?: string): Promise<CartItemWithProductLocal[]> {
  if (!userId) {
    const cognitoUserId = await getCurrentUserId();

    if (!cognitoUserId) {
      console.error("❌ Error de autenticación: Usuario no autenticado");
      throw new Error("Usuario no autenticado");
    }

    userId = cognitoUserId;
  }

  // Usar función optimizada directamente
  try {
    console.log("🔄 Obteniendo carrito para usuario:", userId);
    const data = await getCartItemsSimple(userId);
    console.log("✅ Carrito obtenido:", data);

    return (data || []).map((item) => ({
      ...item,
      product: (item.product as unknown as OpticalProduct) ?? null,
    }));
  } catch (error) {
    console.error("❌ Error al obtener carrito:", error);

    // Si es error 406 o de políticas, dar más información
    if (error instanceof Error) {
      if (error.message.includes("406") || error.message.includes("Not Acceptable")) {
        console.error("🚫 Error 406: Problema con políticas RLS o autenticación");
        throw new Error("Error de permisos: Verifica que estés autenticado correctamente");
      }
    }

    // Retornar array vacío en caso de error para evitar cascada de errores
    return [];
  }
}

/**
 * Agregar producto al carrito
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  prescriptionDetails?: PrescriptionDetails,
  specialInstructions?: string
): Promise<CartItemWithProductLocal> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Usuario no autenticado");

  // Verificar si el producto ya existe en el carrito
  const { data: existingItems, error: checkError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (checkError) {
    console.error("Error al verificar carrito existente:", checkError);
    throw new Error("Error al verificar carrito: " + checkError.message);
  }

  // Si existe un item, actualizar cantidad
  if (existingItems && existingItems.length > 0) {
    const existingItem = existingItems[0];
    console.log("🔄 Producto ya existe en carrito, actualizando cantidad");
    return await updateCartItemQuantity(existingItem.id, existingItem.quantity + quantity);
  }

  // Si no existe, crear nuevo item
  console.log("➕ Creando nuevo item en carrito");
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      user_id: userId,
      product_id: productId,
      quantity,
      prescription_details: prescriptionDetails,
      special_instructions: specialInstructions,
    })
    .select("*")
    .single();

  if (error) {
    console.error("❌ Error adding to cart:", error);
    throw new Error("Error al agregar producto al carrito: " + error.message);
  }

  if (!data) {
    console.error("❌ No se retornaron datos después de insertar");
    throw new Error("Error: No se pudo crear el item del carrito");
  }

  // Obtener información del producto separadamente
  console.log("🔍 Obteniendo detalles del producto:", productId);
  const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", productId).single();

  if (productError) {
    console.warn("⚠️ Error fetching product details:", productError);
    // No lanzar error aquí, solo log warning
  }

  console.log("✅ Item agregado al carrito exitosamente");
  return {
    ...data,
    product: (product as OpticalProduct) || null,
    prescription_details: data.prescription_details as PrescriptionDetails | null,
  } as CartItemWithProductLocal;
}

/**
 * Actualizar cantidad de un item en el carrito
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartItemWithProductLocal> {
  if (quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a 0");
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cartItemId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating cart item:", error);
    throw new Error("Error al actualizar cantidad: " + error.message);
  }

  // Obtener información del producto separadamente
  const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", data.product_id).single();

  if (productError) {
    console.warn("Error fetching product details:", productError);
  }

  return {
    ...data,
    product: (product as OpticalProduct) || null,
    prescription_details: data.prescription_details as PrescriptionDetails | null,
  } as CartItemWithProductLocal;
}

/**
 * Eliminar item del carrito
 */
export async function removeFromCart(cartItemId: string): Promise<void> {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

  if (error) {
    console.error("Error removing from cart:", error);
    throw new Error("Error al eliminar producto del carrito");
  }
}

/**
 * Vaciar todo el carrito del usuario
 */
export async function clearCart(userId?: string): Promise<void> {
  if (!userId) {
    const cognitoUserId = await getCurrentUserId();
    if (!cognitoUserId) throw new Error("Usuario no autenticado");
    userId = cognitoUserId;
  }

  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);

  if (error) {
    console.error("Error clearing cart:", error);
    throw new Error("Error al vaciar carrito");
  }
}

/**
 * Obtener resumen del carrito con totales calculados
 */
export async function getCartSummary(userId?: string): Promise<CartSummary> {
  const items = await getCartItems(userId);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // El precio ya incluye IGV, así que el total es la suma directa
  const total = items.reduce((sum, item) => {
    const price = item.product?.sale_price || item.product?.base_price || 0;
    return sum + price * item.quantity;
  }, 0);

  // El IGV está incluido en el precio, calculamos cuánto representa
  const taxRate = 0.18; // 18% IGV en Perú
  const tax = total * (taxRate / (1 + taxRate)); // IGV incluido en el precio
  const subtotal = total - tax; // Subtotal sin IGV

  // Envío gratuito para pedidos mayores a S/ 300
  const shipping = total >= 300 ? 0 : 25;
  const finalTotal = total + shipping;

  return {
    items,
    totalItems,
    subtotal,
    tax,
    shipping,
    total: finalTotal,
  };
}

/**
 * Obtener número de items en el carrito (para mostrar en navegación)
 */
export async function getCartItemCount(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { data, error } = await supabase.from("cart_items").select("quantity").eq("user_id", userId);

  if (error) {
    console.error("Error getting cart count:", error);
    return 0;
  }

  return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

/**
 * Verificar disponibilidad de stock antes de agregar al carrito
 */
export async function checkProductStock(productId: string, requestedQuantity: number): Promise<boolean> {
  const { data, error } = await supabase.from("products").select("stock_quantity, is_active").eq("id", productId).single();

  if (error || !data) {
    throw new Error("Producto no encontrado");
  }

  if (!data.is_active) {
    throw new Error("Producto no disponible");
  }

  if ((data.stock_quantity ?? 0) < requestedQuantity) {
    throw new Error(`Solo hay ${data.stock_quantity ?? 0} unidades disponibles`);
  }

  return true;
}

/**
 * Formatear precio en soles peruanos
 */
export function formatCartPrice(price: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(price);
}
