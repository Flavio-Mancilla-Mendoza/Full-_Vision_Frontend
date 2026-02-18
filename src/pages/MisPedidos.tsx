// src/pages/MisPedidos.tsx - Página de historial de pedidos del cliente
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserOrders } from "@/hooks/useOrders";
import { useUser } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/common/SEO";
import { OrderCard, OrdersSkeleton, EmptyOrders } from "@/components/orders/my-orders";
import type { Order } from "@/types";

export default function MisPedidos() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: userLoading } = useUser();
  const { data, isLoading: queryLoading, isFetching, isSuccess } = useUserOrders();
  const orders = (data ?? []) as Order[];

  const isLoading = userLoading || queryLoading || (isFetching && !isSuccess);
  const showEmptyState = !isLoading && !isFetching && isSuccess && orders.length === 0;

  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, userLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title="Mis Pedidos - Full Vision"
        description="Revisa el historial de tus pedidos en Full Vision"
      />

      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/profile")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mi perfil
          </Button>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-muted-foreground">
            Revisa el estado de tus pedidos y compras anteriores
          </p>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <OrdersSkeleton />
        ) : showEmptyState ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
