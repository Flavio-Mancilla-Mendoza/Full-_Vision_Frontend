// src/hooks/cart/index.ts - Exports del módulo de carrito
import { useMemo } from "react";
import { useCartQuery } from "./useCartQuery";
import { useCartMutations } from "./useCartMutations";
import { calculateCartSummary } from "./cartUtils";

// Re-export hooks individuales
export { useCartQuery } from "./useCartQuery";
export { useCartMutations } from "./useCartMutations";
export { useCartCount } from "./useCartCount";
export { useIsInCart } from "./useIsInCart";

// Re-export utilidades
export {
  calculateCartSummary,
  calculateProductPrice,
  countCartItems,
  findCartItem,
  type CartSummary,
} from "./cartUtils";

/**
 * Hook principal del carrito - Combina query y mutations
 * Mantiene compatibilidad con useOptimizedAuthCart
 */
export function useCart() {
  const { cartItems, isLoadingCart, user, userLoading, isAuthenticated, invalidateCart } = useCartQuery();

  const mutations = useCartMutations({
    userId: user?.id,
    isAuthenticated,
    invalidateCart,
  });

  // Calcular resumen usando utilidad pura
  const cartSummary = useMemo(() => calculateCartSummary(cartItems), [cartItems]);

  return {
    // Datos
    cartItems,
    cartSummary,
    isAuthenticated,
    isLoading: userLoading || isLoadingCart,

    // Acciones y estados de mutations
    ...mutations,
  };
}
