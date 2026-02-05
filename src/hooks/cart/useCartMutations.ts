// src/hooks/cart/useCartMutations.ts - Mutations del carrito
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCartDrawer } from "@/hooks/useCartDrawer";
import {
  addToCart as addToCartDB,
  updateCartItemQuantity,
  removeFromCart as removeFromCartDB,
  clearCart as clearCartDB,
} from "@/services/cart";
import type { IProduct } from "@/types/IProducts";

interface UseCartMutationsProps {
  userId?: string;
  isAuthenticated: boolean;
  invalidateCart: () => void;
}

/**
 * Helper para mostrar errores (excepto errores de autenticación)
 */
function useErrorHandler() {
  const { toast } = useToast();

  return (error: Error) => {
    if (!error.message.includes("Usuario no autenticado")) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
}

/**
 * Hook con todas las mutations del carrito
 */
export function useCartMutations({ userId, isAuthenticated, invalidateCart }: UseCartMutationsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openDrawer } = useCartDrawer();
  const handleError = useErrorHandler();

  const redirectToLogin = (actionMessage: string) => {
    toast({
      title: "🔐 Inicia sesión requerido",
      description: `Para ${actionMessage}, necesitas crear una cuenta o iniciar sesión`,
      duration: 5000,
    });
    setTimeout(() => navigate("/login"), 1000);
  };

  const requireAuth = (action: string): boolean => {
    if (!isAuthenticated) {
      redirectToLogin(action);
      return false;
    }
    return true;
  };

  // Mutation: Agregar al carrito
  const addToCartMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      product,
    }: {
      productId: string;
      quantity: number;
      product: IProduct;
    }) => {
      console.log("🛒 Iniciando addToCart - Producto:", productId, "Cantidad:", quantity);

      if (!requireAuth("agregar productos al carrito")) {
        throw new Error("Usuario no autenticado");
      }

      console.log("✅ Usuario autenticado, procediendo con addToCart");
      return { result: await addToCartDB(productId, quantity), productId };
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "✅ Producto agregado",
        description: "El producto se agregó al carrito exitosamente",
        duration: 3000,
      });
      openDrawer();
    },
    onError: handleError,
  });

  // Mutation: Actualizar cantidad
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (!requireAuth("actualizar cantidades")) {
        throw new Error("Usuario no autenticado");
      }
      return await updateCartItemQuantity(cartItemId, quantity);
    },
    onSuccess: invalidateCart,
    onError: handleError,
  });

  // Mutation: Eliminar del carrito
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      if (!requireAuth("eliminar productos del carrito")) {
        throw new Error("Usuario no autenticado");
      }
      return await removeFromCartDB(cartItemId);
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "🗑️ Producto eliminado",
        description: "El producto se eliminó del carrito",
      });
    },
    onError: handleError,
  });

  // Mutation: Limpiar carrito
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!requireAuth("limpiar el carrito")) {
        throw new Error("Usuario no autenticado");
      }
      return await clearCartDB(userId!);
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "🧹 Carrito limpiado",
        description: "Se eliminaron todos los productos del carrito",
      });
    },
    onError: handleError,
  });

  return {
    // Acciones
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,

    // Estados de loading
    isAddingToCart: addToCartMutation.isPending,
    addingProductId: addToCartMutation.variables?.productId,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  };
}
