// src/components/orders/my-orders/OrderDetailDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatCurrency, getItemPrice } from "@/lib/order-utils";
import OrderStatusBadge from "./OrderStatusBadge";
import type { Order } from "@/types";

interface OrderDetailDialogProps {
  order: Order;
}

export default function OrderDetailDialog({ order }: OrderDetailDialogProps) {
  const items = order.order_items ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido</DialogTitle>
          <DialogDescription>Orden {order.order_number || order.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status + Total */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Estado actual</p>
              <div className="mt-1">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>

          {/* Products */}
          <OrderItemsList items={items} />

          {/* Price Summary */}
          <PriceSummary order={order} />

          {/* Shipping / Pickup Info */}
          <ShippingInfo order={order} />

          {/* Customer Notes */}
          {order.customer_notes && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Tus Notas</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                {order.customer_notes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Internal Sub-sections ───────────────────────────────────────────

function OrderItemsList({ items }: { items: Order["order_items"] }) {
  if (!items?.length) return null;

  return (
    <div>
      <h3 className="font-semibold mb-3">Productos</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const { unitPrice, totalPrice } = getItemPrice(item);
          return (
            <div key={item.id} className="flex gap-4 pb-3 border-b last:border-0">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded">
                {item.product?.product_images?.[0]?.url && (
                  <img
                    src={item.product.product_images[0].url}
                    alt={item.product.name ?? "Producto"}
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.product?.name ?? "Producto"}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {item.product?.sku ?? "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cantidad: {item.quantity} x {formatCurrency(unitPrice)}
                </p>
                <p className="font-semibold mt-1">{formatCurrency(totalPrice)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriceSummary({ order }: { order: Order }) {
  return (
    <div className="space-y-2 pt-4 border-t">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatCurrency(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>IGV (18%)</span>
        <span>{formatCurrency(order.tax_amount)}</span>
      </div>
      {order.shipping_address && (
        <div className="flex justify-between text-sm">
          <span>Envío</span>
          <span>
            {!order.shipping_amount
              ? "GRATIS"
              : formatCurrency(order.shipping_amount)}
          </span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>Total</span>
        <span>{formatCurrency(order.total_amount)}</span>
      </div>
    </div>
  );
}

function ShippingInfo({ order }: { order: Order }) {
  const isPickup = !order.shipping_address;

  return (
    <div className="pt-4 border-t">
      <h3 className="font-semibold mb-3">
        {isPickup ? "Información de Retiro" : "Información de Envío"}
      </h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
        <p>
          <strong>Nombre:</strong> {order.shipping_name ?? "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {order.shipping_email ?? "N/A"}
        </p>
        <p>
          <strong>Teléfono:</strong> {order.shipping_phone ?? "N/A"}
        </p>
        {isPickup ? (
          <div className="mt-3 pt-3 border-t">
            <p className="font-semibold text-primary">📍 Punto de Retiro:</p>
            <p className="mt-1">Av. Petit Thouars 1821, Lince 15046</p>
            <p className="text-muted-foreground">Lima, Perú</p>
            <p className="text-xs text-muted-foreground mt-2">
              Horario: Lun - Sáb: 9:00 AM - 6:00 PM
            </p>
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ No olvides traer tu DNI para retirar tu pedido
            </p>
          </div>
        ) : (
          <>
            <p>
              <strong>Dirección:</strong> {order.shipping_address}
            </p>
            <p>
              <strong>Ciudad:</strong> {order.shipping_city ?? "N/A"}{" "}
              {order.shipping_postal_code ? `- ${order.shipping_postal_code}` : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
