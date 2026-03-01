// src/components/checkout/OrderConfirmStep.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ShoppingBag, CreditCard } from "lucide-react";
import type { ShippingInfo, DeliveryMethod } from "./types";
import { STORE_ADDRESS, STORE_HOURS } from "./types";

interface OrderConfirmStepProps {
  shippingInfo: ShippingInfo;
  deliveryMethod: DeliveryMethod;
  customerNotes: string;
  isSubmitting: boolean;
  onEditShipping: () => void;
  onCustomerNotesChange: (notes: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function OrderConfirmStep({
  shippingInfo,
  deliveryMethod,
  customerNotes,
  isSubmitting,
  onEditShipping,
  onCustomerNotesChange,
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

        {/* Payment Method — Fixed to MercadoPago */}
        <div>
          <h3 className="font-semibold mb-3">Método de Pago</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span>Mercado Pago</span>
            <span className="text-xs text-muted-foreground">(tarjeta, Yape, Plin, transferencia)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Serás redirigido a Mercado Pago para completar el pago de forma segura.
          </p>
        </div>

        <Separator />

        {/* Customer Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas del pedido (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="¿Alguna indicación especial para tu pedido?"
            value={customerNotes}
            onChange={(e) => onCustomerNotesChange(e.target.value)}
            rows={3}
          />
        </div>

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
                Pagar con Mercado Pago
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
