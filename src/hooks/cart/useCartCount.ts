// src/hooks/cart/useCartCount.ts - Contador optimizado del carrito
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/auth";
import { countCartItems } from "./cartUtils";
import type { CartItemWithProductLocal } from "@/services/cart";

/**
 * Hook optimizado para obtener el contador del carrito
 * Usa datos del cache sin hacer nuevas queries
 */
export function useCartCount() {
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Obtener datos del cache
  const cachedCartItems = queryClient.getQueryData<CartItemWithProductLocal[]>(["cart", user?.id]);

  const count = useMemo(() => {
    if (!isAuthenticated || !cachedCartItems) return 0;
    return countCartItems(cachedCartItems);
  }, [isAuthenticated, cachedCartItems]);

  return {
    count,
    isLoading: userLoading,
    isAuthenticated,
  };
}
