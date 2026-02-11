// src/components/checkout/PaymentMethodSelector.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle, Circle } from "lucide-react";
import type { PaymentMethodType } from "./types";

interface PaymentOption {
  value: PaymentMethodType;
  label: string;
  description: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "mercadopago", label: "Mercado Pago", description: "Tarjeta, transferencia o saldo en MP" },
  { value: "yape", label: "Yape / Plin", description: "Pago por aplicación móvil" },
  { value: "transfer", label: "Transferencia Bancaria", description: "Depósito o transferencia" },
  { value: "cod", label: "Pago Contra Entrega", description: "Paga cuando recibas tu pedido" },
  { value: "store", label: "Pago en Tienda", description: "Recoge y paga en nuestra óptica" },
];

const PAYMENT_ALERTS: Partial<Record<PaymentMethodType, string>> = {
  mercadopago:
    "Serás redirigido a Mercado Pago para completar el pago de forma segura con tarjeta, transferencia o tu saldo disponible.",
  yape: "Te enviaremos los datos para realizar el pago por Yape o Plin una vez confirmes el pedido.",
  transfer: "Te enviaremos los datos bancarios para realizar la transferencia.",
};

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethodType;
  customerNotes: string;
  orderError: string | null;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
  onCustomerNotesChange: (notes: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PaymentMethodSelector({
  paymentMethod,
  customerNotes,
  orderError,
  onPaymentMethodChange,
  onCustomerNotesChange,
  onBack,
  onContinue,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Método de Pago
        </CardTitle>
        <CardDescription>Selecciona cómo deseas pagar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {orderError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{orderError}</AlertDescription>
          </Alert>
        )}

        <RadioGroupPrimitive.Root
          value={paymentMethod}
          onValueChange={(val: string) => onPaymentMethodChange(val as PaymentMethodType)}
          className="space-y-3"
        >
          {PAYMENT_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <RadioGroupPrimitive.Item
                value={option.value}
                id={option.value}
                className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                  <Circle className="h-2.5 w-2.5 fill-current text-current" />
                </RadioGroupPrimitive.Indicator>
              </RadioGroupPrimitive.Item>
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroupPrimitive.Root>

        {PAYMENT_ALERTS[paymentMethod] && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{PAYMENT_ALERTS[paymentMethod]}</AlertDescription>
          </Alert>
        )}

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

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Volver
          </Button>
          <Button onClick={onContinue} className="flex-1">
            Revisar Pedido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
