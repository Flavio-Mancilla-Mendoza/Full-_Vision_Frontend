// src/components/checkout/ShippingForm.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Separator } from "@/components/ui/separator";
import { Truck, ShoppingBag, Circle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingInfo, DeliveryMethod } from "./types";
import { STORE_ADDRESS, STORE_HOURS } from "./types";

interface ShippingFormProps {
  shippingInfo: ShippingInfo;
  deliveryMethod: DeliveryMethod;
  formErrors: Record<string, string>;
  shippingCost?: number;
  onShippingInfoChange: (info: ShippingInfo) => void;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  onSubmit: () => void;
}

export function ShippingForm({
  shippingInfo,
  deliveryMethod,
  formErrors,
  shippingCost = 0,
  onShippingInfoChange,
  onDeliveryMethodChange,
  onSubmit,
}: ShippingFormProps) {
  const updateField = (field: keyof ShippingInfo, value: string) => {
    onShippingInfoChange({ ...shippingInfo, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Método de Entrega
        </CardTitle>
        <CardDescription>Elige cómo quieres recibir tu pedido</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Delivery Method Selection */}
          <div className="space-y-3">
            <Label>Método de entrega *</Label>
            <RadioGroupPrimitive.Root
              value={deliveryMethod}
              onValueChange={(value: string) => onDeliveryMethodChange(value as DeliveryMethod)}
              className="space-y-3"
            >
              {/* Envío a domicilio */}
              <div
                className={cn(
                  "flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors",
                  deliveryMethod === "shipping" ? "border-primary bg-primary/5" : "hover:bg-gray-50",
                )}
              >
                <RadioGroupPrimitive.Item value="shipping" className="h-5 w-5 rounded-full border-2 border-primary mt-0.5">
                  <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                    <Circle className="h-2.5 w-2.5 fill-primary" />
                  </RadioGroupPrimitive.Indicator>
                </RadioGroupPrimitive.Item>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <Label htmlFor="shipping" className="font-semibold cursor-pointer">
                      Envío a domicilio
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recibe tu pedido en la dirección que indiques.
                    <span className="font-medium"> Envío gratis en compras mayores a S/ 300</span>
                  </p>
                  {shippingCost > 0 && (
                    <p className="text-sm text-primary mt-1">Costo de envío: S/ {shippingCost.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Retiro en tienda */}
              <div
                className={cn(
                  "flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors",
                  deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "hover:bg-gray-50",
                )}
              >
                <RadioGroupPrimitive.Item value="pickup" className="h-5 w-5 rounded-full border-2 border-primary mt-0.5">
                  <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                    <Circle className="h-2.5 w-2.5 fill-primary" />
                  </RadioGroupPrimitive.Indicator>
                </RadioGroupPrimitive.Item>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <Label htmlFor="pickup" className="font-semibold cursor-pointer">
                      Retiro en tienda
                    </Label>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">GRATIS</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Retira tu pedido en nuestra tienda física.</p>
                  <p className="text-sm font-medium mt-2">📍 {STORE_ADDRESS}</p>
                  <p className="text-xs text-muted-foreground mt-1">{STORE_HOURS}</p>
                </div>
              </div>
            </RadioGroupPrimitive.Root>
          </div>

          <Separator />

          {/* Contact Information (always required) */}
          <div className="space-y-4">
            <h3 className="font-semibold">Información de contacto</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={shippingInfo.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="999 999 999"
                value={shippingInfo.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
            </div>

            {/* DNI Field (only for pickup) */}
            {deliveryMethod === "pickup" && (
              <div className="space-y-2">
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  type="text"
                  placeholder="12345678"
                  maxLength={8}
                  value={shippingInfo.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    updateField("dni", value);
                  }}
                  className={formErrors.dni ? "border-red-500" : ""}
                />
                {formErrors.dni && <p className="text-sm text-red-500">{formErrors.dni}</p>}
                <p className="text-xs text-muted-foreground">Necesitarás presentar tu DNI al retirar tu pedido en tienda</p>
              </div>
            )}
          </div>

          {/* Shipping Address (only for delivery) */}
          {deliveryMethod === "shipping" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Dirección de envío</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección completa *</Label>
                  <Input
                    id="address"
                    placeholder="Jr. Los Lentes 123, San Isidro"
                    value={shippingInfo.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className={formErrors.address ? "border-red-500" : ""}
                  />
                  {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      placeholder="Lima"
                      value={shippingInfo.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={formErrors.city ? "border-red-500" : ""}
                    />
                    {formErrors.city && <p className="text-sm text-red-500">{formErrors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Código Postal *</Label>
                    <Input
                      id="postal_code"
                      placeholder="15001"
                      value={shippingInfo.postal_code}
                      onChange={(e) => updateField("postal_code", e.target.value)}
                      className={formErrors.postal_code ? "border-red-500" : ""}
                    />
                    {formErrors.postal_code && <p className="text-sm text-red-500">{formErrors.postal_code}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" size="lg">
            Continuar al Pago
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
