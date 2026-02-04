// src/hooks/useOrders.ts - Hook para gestionar órdenes
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useAuthCognito";
import { getOrders, getOrder, type Order } from "@/services/orders";
import { createOrderFromCart, updateOrderStatus, getAllOrdersPaginated } from "@/services/admin";
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

// Hook para crear orden desde el carrito
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      cartItems,
      shippingInfo,
      paymentMethod,
      customerNotes,
    }: {
      userId: string;
      cartItems: Array<{
        product_id: string;
        quantity: number;
        product?: { name?: string; sale_price?: number; base_price?: number } | null;
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
      return createOrderFromCart(userId, cartItems, shippingInfo, paymentMethod, customerNotes);
    },
    onSuccess: async (order, variables) => {
      // Invalidar queries del carrito y órdenes
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Enviar email de confirmación
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            order_number: order.order_number,
            customer_name: variables.shippingInfo.name,
            customer_email: variables.shippingInfo.email,
            customer_phone: variables.shippingInfo.phone,
            total_amount: order.total_amount,
            subtotal: order.subtotal,
            tax_amount: order.tax_amount,
            shipping_amount: order.shipping_amount,
            shipping_address: variables.shippingInfo.address || null,
            shipping_city: variables.shippingInfo.city || null,
            customer_dni: variables.shippingInfo.dni || null,
            payment_method: variables.paymentMethod,
            items: variables.cartItems.map((item) => ({
              name: item.product?.name || "Producto",
              quantity: item.quantity,
              unit_price: item.product?.sale_price || item.product?.base_price || 0,
              total_price: (item.product?.sale_price || item.product?.base_price || 0) * item.quantity,
            })),
          }),
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // No mostramos error al usuario, el pedido se creó correctamente
      }

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
