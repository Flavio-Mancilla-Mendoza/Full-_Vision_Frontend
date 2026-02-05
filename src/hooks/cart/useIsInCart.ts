// src/hooks/cart/useIsInCart.ts - Verificar si producto está en carrito
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/auth";
import { findCartItem } from "./cartUtils";
import type { CartItemWithProductLocal } from "@/services/cart";

/**
 * Hook para verificar si un producto está en el carrito
 * Usa datos del cache sin hacer nuevas queries
 */
export function useIsInCart(productId: string) {
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Obtener datos del cache
  const cachedCartItems = queryClient.getQueryData<CartItemWithProductLocal[]>(["cart", user?.id]);

  const result = useMemo(() => {
    if (!isAuthenticated || !cachedCartItems || !productId) {
      return { isInCart: false, quantity: 0 };
    }
    return findCartItem(cachedCartItems, productId);
  }, [isAuthenticated, cachedCartItems, productId]);

  return {
    ...result,
    isLoading: userLoading,
    isAuthenticated,
  };
}
