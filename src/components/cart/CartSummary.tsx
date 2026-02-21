// src/components/cart/CartSummary.tsx - Resumen del carrito con totales
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Truck, Receipt } from "lucide-react";
import { useCart as useAuthCart } from "@/hooks/cart";
import { formatCartPrice } from "@/services/cart";

interface CartSummaryProps {
  onCheckout?: () => void;
}

export default function CartSummary({ onCheckout }: CartSummaryProps) {
  const { cartSummary: summary, isLoading, cartItems } = useAuthCart();
  const hasItems = cartItems && Array.isArray(cartItems) && cartItems.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Resumen del pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || !hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Resumen del pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Tu carrito está vacío</p>
        </CardContent>
      </Card>
    );
  }

  const { totalItems, subtotal, tax, shipping, total } = summary;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Resumen del pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal (sin IGV) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Subtotal (sin IGV)</span>
          </div>
          <span className="font-medium">{formatCartPrice(subtotal)}</span>
        </div>

        {/* IGV incluido */}
        <div className="flex items-center justify-between">
          <span className="text-sm">IGV (18%) incluido</span>
          <span className="font-medium">{formatCartPrice(tax)}</span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span className="text-sm">Envío</span>
          </div>
          <div className="text-right">
            {shipping === 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  GRATIS
                </Badge>
                <span className="font-medium">{formatCartPrice(shipping)}</span>
              </div>
            ) : (
              <span className="font-medium">{formatCartPrice(shipping)}</span>
            )}
          </div>
        </div>

        {/* Envío gratis message */}
        {shipping > 0 && total < 300 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm">Agrega {formatCartPrice(300 - (total - shipping))} más para envío gratuito</p>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total (con IGV incluido)</span>
          <span className="text-primary">{formatCartPrice(total)}</span>
        </div>

        {/* Checkout button */}
        <Button className="w-full" size="lg" onClick={onCheckout} disabled={!hasItems}>
          Proceder al pago
        </Button>

        {/* Additional info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Precios incluyen IGV</p>
          <p>• Envío gratuito en pedidos mayores a S/ 300</p>
          <p>• Tiempo de entrega: 3-5 días hábiles</p>
        </div>

        {/* Security badges */}
        <div className="flex justify-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs">
            🔒 Pago seguro
          </Badge>
          <Badge variant="outline" className="text-xs">
            📦 Garantía
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
