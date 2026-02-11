// src/components/orders/my-orders/OrderCard.tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import { formatCurrency, formatOrderDate } from "@/lib/order-utils";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderItemPreview from "./OrderItemPreview";
import OrderDetailDialog from "./OrderDetailDialog";
import type { Order } from "@/types";

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const items = order.order_items ?? [];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              Orden {order.order_number || order.id}
            </CardTitle>
            <CardDescription>
              Realizada el {formatOrderDate(order.created_at)}
            </CardDescription>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <OrderStatusBadge status={order.status} />
            <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <OrderItemPreview items={items} />
        <Separator />
        <div className="flex gap-2">
          <OrderDetailDialog order={order} />
          {order.status === "delivered" && (
            <Button variant="default" size="sm" asChild>
              <Link to="/productos">
                <ShoppingBag className="h-4 w-4 mr-1" />
                Comprar de nuevo
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
