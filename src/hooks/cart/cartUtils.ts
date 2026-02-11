// src/hooks/cart/cartUtils.ts - Funciones puras para cálculos del carrito
import type { CartItemWithProductLocal } from "@/services/cart";
import { calculateFinalPrice } from "@/lib/product-utils";

export interface CartSummary {
  items: CartItemWithProductLocal[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

const TAX_RATE = 0.18; // 18% IGV
const FREE_SHIPPING_THRESHOLD = 300;
const SHIPPING_COST = 25;

/**
 * Calcula el precio final de un producto considerando descuentos.
 * Wrapper sobre calculateFinalPrice centralizado para mantener compatibilidad.
 */
export function calculateProductPrice(product: {
  base_price?: number | null;
  sale_price?: number | null;
  discount_percentage?: number | null;
}): number {
  return calculateFinalPrice({ base_price: product.base_price || 0, sale_price: product.sale_price, discount_percentage: product.discount_percentage });
}

/**
 * Calcula el resumen completo del carrito
 */
export function calculateCartSummary(cartItems: CartItemWithProductLocal[]): CartSummary | null {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return null;
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const total = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    const finalPrice = calculateProductPrice(item.product);
    return sum + finalPrice * item.quantity;
  }, 0);

  // El IGV está incluido en el precio, calculamos cuánto representa
  const tax = total * (TAX_RATE / (1 + TAX_RATE));
  const subtotal = total - tax;

  // Envío gratuito para pedidos mayores al umbral
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const finalTotal = total + shipping;

  return {
    items: cartItems,
    totalItems,
    subtotal,
    tax,
    shipping,
    total: finalTotal,
  };
}

/**
 * Cuenta el total de items en el carrito
 */
export function countCartItems(cartItems: CartItemWithProductLocal[]): number {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Encuentra un item en el carrito por productId
 */
export function findCartItem(
  cartItems: CartItemWithProductLocal[],
  productId: string
): { isInCart: boolean; quantity: number } {
  if (!cartItems || !productId) {
    return { isInCart: false, quantity: 0 };
  }

  const item = cartItems.find((item) => item.product_id === productId);
  return {
    isInCart: !!item,
    quantity: item?.quantity || 0,
  };
}
