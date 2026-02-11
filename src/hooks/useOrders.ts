// src/hooks/useOrders.ts - Hook para gestionar órdenes
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useAuthCognito";
import { getOrders, getOrder, type Order } from "@/services/orders";
import { updateOrderStatus, getAllOrdersPaginated } from "@/services/admin";
import { getApiUrl } from "@/services/api";
import { fetchAuthSession } from "@aws-amplify/auth";
import type { OrderStatus } from "@/types";

// Hook para obtener órdenes paginadas (Admin)
export function useOrdersPaginated(
  page = 1,
  limit = 50,
  filters: {
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {}
) {
  return useQuery({
    queryKey: ["orders", "paginated", page, limit, filters],
    queryFn: () => getAllOrdersPaginated(page, limit, filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook para obtener órdenes del usuario actual
export function useUserOrders() {
  const { user } = useUser();

  return useQuery<Order[]>({
    queryKey: ["orders", "user", user?.id],
    queryFn: getOrders,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Hook para crear orden desde el carrito — via API Gateway (precios server-side)
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      cartItems,
      shippingInfo,
      paymentMethod,
      customerNotes,
    }: {
      userId?: string; // kept for backwards compat but ignored — server uses JWT
      cartItems: Array<{
        product_id: string;
        quantity: number;
        // product info is ignored server-side; prices come from DB
        product?: { name?: string; sale_price?: number | null; base_price?: number } | null;
      }>;
      shippingInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postal_code: string;
        dni?: string;
      };
      paymentMethod: string;
      customerNotes?: string;
    }) => {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${getApiUrl()}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          shippingInfo,
          paymentMethod,
          customerNotes: customerNotes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error creating order: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (order) => {
      // Invalidar queries del carrito y órdenes
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // El email de confirmación se envía desde el Lambda server-side
      // — ya no se envía desde el frontend

      toast({
        title: "✅ Pedido creado exitosamente",
        description: `Número de orden: ${order.order_number}`,
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al crear el pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para actualizar estado de orden (Admin)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, status, adminNotes }: { orderId: string; status: OrderStatus; adminNotes?: string }) => {
      return updateOrderStatus(orderId, status, adminNotes);
    },
    onSuccess: (updatedOrder) => {
      // Invalidar queries de órdenes
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast({
        title: "✅ Estado actualizado",
        description: `Orden ${updatedOrder.order_number} actualizada a: ${updatedOrder.status}`,
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
