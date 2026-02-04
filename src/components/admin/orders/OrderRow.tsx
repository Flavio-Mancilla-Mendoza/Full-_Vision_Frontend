import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "./OrderActions";
import type { Order } from "@/types";

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
    pending: { variant: "secondary", label: "Pendiente" },
    confirmed: { variant: "default", label: "Confirmado" },
    processing: { variant: "default", label: "Procesando" },
    ready_for_pickup: { variant: "default", label: "Listo para Recojo" },
    shipped: { variant: "default", label: "Enviado" },
    delivered: { variant: "default", label: "Entregado" },
    cancelled: { variant: "destructive", label: "Cancelado" },
  };
  return variants[status] ? (
    <Badge variant={variants[status].variant}>{variants[status].label}</Badge>
  ) : (
    <Badge variant="secondary">{status}</Badge>
  );
}

export const OrderRow: React.FC<{ order: Order; onView: (order: Order) => void }> = ({ order, onView }) => {
  return (
    <TableRow key={order.id}>
      <TableCell className="font-medium">{order.order_number}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{order.shipping_name}</p>
          <p className="text-sm text-muted-foreground">{order.shipping_email}</p>
        </div>
      </TableCell>
      <TableCell>{new Date(order.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" })}</TableCell>
      <TableCell className="font-semibold">S/ {order.total_amount.toFixed(2)}</TableCell>
      <TableCell>{getStatusBadge(order.status)}</TableCell>
      <TableCell className="text-right">
        <OrderActions order={order} onView={onView} />
      </TableCell>
    </TableRow>
  );
};

export default OrderRow;
