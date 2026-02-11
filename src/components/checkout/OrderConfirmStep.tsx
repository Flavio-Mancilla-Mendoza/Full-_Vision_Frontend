// src/components/checkout/OrderConfirmStep.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import type { ShippingInfo, DeliveryMethod, PaymentMethodType } from "./types";
import { PAYMENT_METHOD_LABELS, STORE_ADDRESS, STORE_HOURS } from "./types";

interface OrderConfirmStepProps {
  shippingInfo: ShippingInfo;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethodType;
  customerNotes: string;
  isSubmitting: boolean;
  onEditShipping: () => void;
  onEditPayment: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function OrderConfirmStep({
  shippingInfo,
  deliveryMethod,
  paymentMethod,
  customerNotes,
  isSubmitting,
  onEditShipping,
  onEditPayment,
  onBack,
  onConfirm,
}: OrderConfirmStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Confirmar Pedido
        </CardTitle>
        <CardDescription>Revisa tu información antes de confirmar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shipping/Pickup Info Summary */}
        <div>
          <h3 className="font-semibold mb-3">
            {deliveryMethod === "pickup" ? "Información de Retiro" : "Información de Envío"}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <p>
              <strong>Nombre:</strong> {shippingInfo.name}
            </p>
            <p>
              <strong>Email:</strong> {shippingInfo.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {shippingInfo.phone}
            </p>
            {deliveryMethod === "pickup" ? (
              <>
                {shippingInfo.dni && (
                  <p>
                    <strong>DNI:</strong> {shippingInfo.dni}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t">
                  <p className="font-semibold text-primary">📍 Punto de Retiro:</p>
                  <p className="mt-1">{STORE_ADDRESS}</p>
                  <p className="text-xs text-muted-foreground mt-2">Horario: {STORE_HOURS}</p>
                </div>
              </>
            ) : (
              <>
                <p>
                  <strong>Dirección:</strong> {shippingInfo.address}
                </p>
                <p>
                  <strong>Ciudad:</strong> {shippingInfo.city} - {shippingInfo.postal_code}
                </p>
              </>
            )}
          </div>
          <Button variant="link" onClick={onEditShipping} className="mt-2 p-0 h-auto">
            Editar
          </Button>
        </div>

        <Separator />

        {/* Payment Method Summary */}
        <div>
          <h3 className="font-semibold mb-3">Método de Pago</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p>{PAYMENT_METHOD_LABELS[paymentMethod]}</p>
          </div>
          <Button variant="link" onClick={onEditPayment} className="mt-2 p-0 h-auto">
            Editar
          </Button>
        </div>

        {customerNotes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Notas del Pedido</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p>{customerNotes}</p>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Volver
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} className="flex-1" size="lg">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
