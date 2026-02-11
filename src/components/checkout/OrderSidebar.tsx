// src/components/checkout/OrderSidebar.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { S3Image } from "@/components/common/S3Image";
import type { CartSummary } from "@/hooks/cart";
import type { CartItemWithProductLocal } from "@/services/cart";

interface OrderSidebarProps {
  cartItems: CartItemWithProductLocal[];
  cartSummary: CartSummary | null;
}

export function OrderSidebar({ cartItems, cartSummary }: OrderSidebarProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-3 text-sm">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                {item.product?.product_images && item.product.product_images.length > 0 ? (
                  <S3Image
                    s3Key={item.product.product_images[0].s3_key}
                    url={item.product.product_images[0].url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.product?.name}</p>
                <p className="text-muted-foreground">Cantidad: {item.quantity}</p>
                <p className="font-semibold">
                  S/ {((item.product?.sale_price || item.product?.base_price || 0) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price Summary */}
        {cartSummary && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>S/ {(cartSummary.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18%)</span>
              <span>S/ {(cartSummary.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{(cartSummary.shipping || 0) === 0 ? "GRATIS" : `S/ ${(cartSummary.shipping || 0).toFixed(2)}`}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>S/ {(cartSummary.total || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {cartSummary && cartSummary.subtotal >= 300 && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">¡Envío gratis en tu pedido!</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
