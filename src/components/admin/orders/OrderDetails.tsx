import React from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { Order } from "@/types";

export const OrderDetailsContent: React.FC<{
  order: Order;
  newStatus: string;
  setNewStatus: (s: string) => void;
  adminNotes: string;
  setAdminNotes: (s: string) => void;
  onUpdateStatus: () => Promise<void>;
}> = ({ order, newStatus, setNewStatus, adminNotes, setAdminNotes, onUpdateStatus }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Detalles del Pedido</DialogTitle>
        <DialogDescription>Orden {order.order_number}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Customer Info */}
        <div>
          <h3 className="font-semibold mb-3">{order.shipping_address ? "Información de Envío" : "Información de Retiro en Tienda"}</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <p>
              <strong>Nombre:</strong> {order.shipping_name}
            </p>
            <p>
              <strong>Email:</strong> {order.shipping_email}
            </p>
            <p>
              <strong>Teléfono:</strong> {order.shipping_phone}
            </p>
            {order.shipping_address ? (
              <>
                <p>
                  <strong>Dirección:</strong> {order.shipping_address}
                </p>
                <p>
                  <strong>Ciudad:</strong> {order.shipping_city} - {order.shipping_postal_code}
                </p>
              </>
            ) : (
              <>
                {order.customer_dni && (
                  <p>
                    <strong>DNI:</strong> {order.customer_dni}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t">
                  <p className="font-semibold text-primary">📍 Punto de Retiro:</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="bg-white rounded-lg border p-3 space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.product?.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {item.product?.sku}</div>
                </div>
                <div className="text-right">
                  <div>
                    {item.quantity} x ${item.unit_price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin notes */}
        <div>
          <h3 className="font-semibold mb-2">Notas Administrativas</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">{order.admin_notes}</div>
        </div>

        {/* Status update controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Seleccionar estado</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="processing">Procesando</option>
              <option value="ready_for_pickup">Listo para Recojo</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <button onClick={onUpdateStatus} className="btn btn-primary">
              Actualizar estado
            </button>
          </div>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Notas administrativas (opcional)"
          />
        </div>
      </div>
    </>
  );
};

export default OrderDetailsContent;
