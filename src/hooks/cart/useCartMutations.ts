// src/hooks/cart/useCartMutations.ts - Mutations del carrito con optimistic updates
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCartDrawer } from "@/hooks/useCartDrawer";
import {
  addToCart as addToCartDB,
  updateCartItemQuantity,
  removeFromCart as removeFromCartDB,
  clearCart as clearCartDB,
  type CartItemWithProductLocal,
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

  return (error: Error, _variables: unknown, context: { previousItems?: CartItemWithProductLocal[] } | undefined) => {
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
 * Hook con todas las mutations del carrito (optimistic updates)
 */
export function useCartMutations({ userId, isAuthenticated, invalidateCart }: UseCartMutationsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openDrawer } = useCartDrawer();
  const handleError = useErrorHandler();
  const queryClient = useQueryClient();

  const cartQueryKey = ["cart", userId];

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

  // Mutation: Agregar al carrito (con optimistic update)
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
      if (!requireAuth("agregar productos al carrito")) {
        throw new Error("Usuario no autenticado");
      }
      return { result: await addToCartDB(productId, quantity), productId };
    },
    onMutate: async ({ productId, quantity, product }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cartQueryKey });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<CartItemWithProductLocal[]>(cartQueryKey);

      // Optimistically update
      queryClient.setQueryData<CartItemWithProductLocal[]>(cartQueryKey, (old = []) => {
        const existingIndex = old.findIndex((item) => item.product_id === productId);
        if (existingIndex >= 0) {
          // Increment quantity
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }
        // Add new item (optimistic — replaced by real data on success)
        return [
          ...old,
          {
            id: `temp-${Date.now()}`,
            user_id: userId || "",
            product_id: productId,
            quantity,
            product: {
              ...product,
              sale_price: product.sale_price ?? null,
              discount_percentage: product.discount_percentage ?? null,
              image_url: product.image_url ?? null,
              product_images: product.product_images ?? [],
              brand: product.brand ?? null,
              category: product.category ?? null,
              stock_quantity: product.stock_quantity ?? 0,
            } as unknown as CartItemWithProductLocal["product"],
            prescription_details: null,
            special_instructions: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } satisfies Omit<CartItemWithProductLocal, "product"> & { product: unknown } as CartItemWithProductLocal,
        ];
      });

      return { previousItems };
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "✅ Producto agregado",
        description: "El producto se agregó al carrito exitosamente",
        duration: 2000,
      });
      openDrawer();
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(cartQueryKey, context.previousItems);
      }
      handleError(error, _variables, context);
    },
  });

  // Mutation: Actualizar cantidad (con optimistic update)
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (!requireAuth("actualizar cantidades")) {
        throw new Error("Usuario no autenticado");
      }
      return await updateCartItemQuantity(cartItemId, quantity);
    },
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousItems = queryClient.getQueryData<CartItemWithProductLocal[]>(cartQueryKey);

      queryClient.setQueryData<CartItemWithProductLocal[]>(cartQueryKey, (old = []) =>
        old.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
      );

      return { previousItems };
    },
    onSuccess: () => {
      invalidateCart();
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(cartQueryKey, context.previousItems);
      }
      handleError(error, _variables, context);
    },
  });

  // Mutation: Eliminar del carrito (con optimistic update)
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      if (!requireAuth("eliminar productos del carrito")) {
        throw new Error("Usuario no autenticado");
      }
      return await removeFromCartDB(cartItemId);
    },
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousItems = queryClient.getQueryData<CartItemWithProductLocal[]>(cartQueryKey);

      queryClient.setQueryData<CartItemWithProductLocal[]>(cartQueryKey, (old = []) =>
        old.filter((item) => item.id !== cartItemId)
      );

      return { previousItems };
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "🗑️ Producto eliminado",
        description: "El producto se eliminó del carrito",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(cartQueryKey, context.previousItems);
      }
      handleError(error, _variables, context);
    },
  });

  // Mutation: Limpiar carrito (con optimistic update)
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!requireAuth("limpiar el carrito")) {
        throw new Error("Usuario no autenticado");
      }
      return await clearCartDB(userId!);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previousItems = queryClient.getQueryData<CartItemWithProductLocal[]>(cartQueryKey);
      queryClient.setQueryData(cartQueryKey, []);
      return { previousItems };
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "🧹 Carrito limpiado",
        description: "Se eliminaron todos los productos del carrito",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(cartQueryKey, context.previousItems);
      }
      handleError(error, _variables, context);
    },
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
