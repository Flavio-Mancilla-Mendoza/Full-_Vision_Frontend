// src/hooks/useOptimizedAuthCart.ts - Versión optimizada del carrito
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useAuthCognito";
import { useNavigate } from "react-router-dom";
import { useMemo, useEffect } from "react";
import {
  getCartItems,
  addToCart as addToCartDB,
  updateCartItemQuantity,
  removeFromCart as removeFromCartDB,
  clearCart as clearCartDB,
  type CartItemWithProductLocal,
} from "@/services/cart";
import { OpticalProduct } from "@/services/admin";
import { useCartDrawer } from "@/hooks/useCartDrawer";
import { IProduct } from "@/types/IProducts";

export function useOptimizedAuthCart() {
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openDrawer } = useCartDrawer();
  const navigate = useNavigate();

  // Una sola query para el carrito
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
      // No reintentar errores de autenticación
      if (error instanceof Error) {
        if (error.message.includes("autenticación") || error.message.includes("permisos") || error.message.includes("406")) {
          console.warn("🚫 No reintentando error de autenticación:", error.message);
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  // Mostrar notificación cuando hay items en el carrito al cargar (solo una vez por sesión)
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

  // Manejar errores del carrito separadamente
  if (error instanceof Error && error.message.includes("permisos")) {
    toast({
      title: "⚠️ Problema de autenticación",
      description: "Por favor, cierra sesión e inicia sesión nuevamente",
      variant: "destructive",
    });
  }

  // Calcular resumen del carrito usando los items ya obtenidos
  const cartSummary = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) return null;

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Calcular el total considerando descuentos
    const total = cartItems.reduce((sum, item) => {
      const product = item.product;
      if (!product) return sum;

      // Calcular precio final con descuento
      let finalPrice = product.base_price || 0;
      if (product.sale_price) {
        finalPrice = product.sale_price;
      } else if (product.discount_percentage && product.discount_percentage > 0) {
        finalPrice = (product.base_price || 0) * (1 - product.discount_percentage / 100);
      }

      return sum + finalPrice * item.quantity;
    }, 0);

    // El IGV está incluido en el precio, calculamos cuánto representa
    const taxRate = 0.18; // 18% IGV
    const tax = total * (taxRate / (1 + taxRate)); // IGV incluido en el precio
    const subtotal = total - tax; // Subtotal sin IGV

    // Envío gratuito para pedidos mayores a S/ 300
    const shipping = total >= 300 ? 0 : 25;
    const finalTotal = total + shipping;

    return {
      items: cartItems,
      totalItems,
      subtotal,
      tax,
      shipping,
      total: finalTotal,
    };
  }, [cartItems]);

  // Helper para invalidar solo el carrito
  const invalidateCart = () => {
    queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
  };

  // Función para redirigir a login
  const redirectToLogin = (actionMessage: string) => {
    toast({
      title: "🔐 Inicia sesión requerido",
      description: `Para ${actionMessage}, necesitas crear una cuenta o iniciar sesión`,
      duration: 5000,
    });

    // Navegación después de mostrar el toast
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  // Mutations optimizadas
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, product }: { productId: string; quantity: number; product: IProduct }) => {
      console.log("🛒 Iniciando addToCart - Producto:", productId, "Cantidad:", quantity);

      if (!isAuthenticated) {
        console.log("❌ Usuario no autenticado, redirigiendo a login");
        redirectToLogin("agregar productos al carrito");
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
      // Abrir el drawer del carrito para mostrar feedback visual
      openDrawer();
    },
    onError: (error: Error) => {
      // No mostrar error si es de autenticación (ya se maneja en redirectToLogin)
      if (!error.message.includes("Usuario no autenticado")) {
        toast({
          title: "❌ Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (!isAuthenticated) {
        redirectToLogin("actualizar cantidades");
        throw new Error("Usuario no autenticado");
      }
      return await updateCartItemQuantity(cartItemId, quantity);
    },
    onSuccess: () => {
      invalidateCart();
    },
    onError: (error: Error) => {
      if (!error.message.includes("Usuario no autenticado")) {
        toast({
          title: "❌ Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      if (!isAuthenticated) {
        redirectToLogin("eliminar productos del carrito");
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
    onError: (error: Error) => {
      if (!error.message.includes("Usuario no autenticado")) {
        toast({
          title: "❌ Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        redirectToLogin("limpiar el carrito");
        throw new Error("Usuario no autenticado");
      }
      return await clearCartDB(user!.id);
    },
    onSuccess: () => {
      invalidateCart();
      toast({
        title: "🧹 Carrito limpiado",
        description: "Se eliminaron todos los productos del carrito",
      });
    },
    onError: (error: Error) => {
      if (!error.message.includes("Usuario no autenticado")) {
        toast({
          title: "❌ Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  return {
    // Datos
    cartItems,
    cartSummary,
    isAuthenticated,
    isLoading: userLoading || isLoadingCart,

    // Acciones
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,

    // Estados de loading
    isAddingToCart: addToCartMutation.isPending,
    addingProductId: addToCartMutation.variables?.productId, // ID del producto que se está agregando
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  };
}

// Hook optimizado para el contador (usa los mismos datos)
export function useOptimizedAuthCartCount() {
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Intentar obtener datos del cache primero
  const cachedCartItems = queryClient.getQueryData<CartItemWithProductLocal[]>(["cart", user?.id]);

  const count = useMemo(() => {
    if (!isAuthenticated || !cachedCartItems) return 0;
    return cachedCartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [isAuthenticated, cachedCartItems]);

  return {
    count,
    isLoading: userLoading,
    isAuthenticated,
  };
}

// Hook optimizado para verificar si producto está en carrito
export function useOptimizedIsInAuthCart(productId: string) {
  const { user, loading: userLoading, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Usar datos del cache si están disponibles
  const cachedCartItems = queryClient.getQueryData<CartItemWithProductLocal[]>(["cart", user?.id]);

  const result = useMemo(() => {
    if (!isAuthenticated || !cachedCartItems || !productId) {
      return { isInCart: false, quantity: 0 };
    }

    const item = cachedCartItems.find((item) => item.product_id === productId);
    return {
      isInCart: !!item,
      quantity: item?.quantity || 0,
    };
  }, [isAuthenticated, cachedCartItems, productId]);

  return {
    ...result,
    isLoading: userLoading,
    isAuthenticated,
  };
}
