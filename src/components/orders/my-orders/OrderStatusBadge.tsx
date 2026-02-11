// src/components/orders/my-orders/OrderStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { getOrderStatusConfig } from "@/lib/order-utils";

interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = getOrderStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${config.color}`} />
      <Badge variant={config.variant}>{config.label}</Badge>
    </div>
  );
}
