// src/hooks/cart/useCartQuery.ts - Query principal del carrito
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/auth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCartItems, type CartItemWithProductLocal } from "@/services/cart";

/**
 * Hook para obtener los items del carrito con React Query
 */
export function useCartQuery() {
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: cartItems = [],
    isLoading: isLoadingCart,
    error,
  } = useQuery<CartItemWithProductLocal[]>({
    queryKey: ["cart", user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("Usuario no válido");
      }
      console.log("🔄 Ejecutando query del carrito para usuario:", user.id);
      return getCartItems(user.id);
    },
    enabled: isAuthenticated && !!user?.id && !userLoading,
    staleTime: 1000 * 60 * 15, // 15 minutos
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (
          error.message.includes("autenticación") ||
          error.message.includes("permisos") ||
          error.message.includes("406")
        ) {
          console.warn("🚫 No reintentando error de autenticación:", error.message);
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  // Notificación de bienvenida (una vez por sesión)
  useEffect(() => {
    const hasShownKey = `cart-welcome-shown-${user?.id}`;
    const hasShown = sessionStorage.getItem(hasShownKey);

    if (!isLoadingCart && cartItems.length > 0 && !hasShown && isAuthenticated) {
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      sessionStorage.setItem(hasShownKey, "true");

      toast({
        title: "🛒 Carrito guardado",
        description: `Tienes ${totalItems} producto${totalItems > 1 ? "s" : ""} en tu carrito`,
        duration: 4000,
      });
    }
  }, [cartItems, isLoadingCart, toast, isAuthenticated, user?.id]);

  // Manejar errores de permisos
  useEffect(() => {
    if (error instanceof Error && error.message.includes("permisos")) {
      toast({
        title: "⚠️ Problema de autenticación",
        description: "Por favor, cierra sesión e inicia sesión nuevamente",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const invalidateCart = () => {
    queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
  };

  return {
    cartItems,
    isLoadingCart,
    error,
    user,
    userLoading,
    isAuthenticated,
    invalidateCart,
    queryClient,
  };
}
