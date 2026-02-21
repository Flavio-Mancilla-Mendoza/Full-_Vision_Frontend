// src/components/cart/CartItem.tsx - Componente para cada item del carrito
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, AlertTriangle, Package } from "lucide-react";
import { useCart as useAuthCart } from "@/hooks/cart";
import { formatCartPrice, type CartItemWithProductLocal } from "@/services/cart";

interface CartItemProps {
  item: CartItemWithProductLocal;
}

export default function CartItemComponent({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart, isUpdatingQuantity, isRemovingFromCart } = useAuthCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  const product = item.product;
  if (!product) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertTriangle className="w-5 h-5" />
            <span>Producto no disponible</span>
            <Button variant="outline" size="sm" onClick={() => removeFromCart(item.id)} disabled={isRemovingFromCart}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular precio final con descuento
  let finalPrice = product.base_price;
  if (product.sale_price) {
    finalPrice = product.sale_price;
  } else if (product.discount_percentage && product.discount_percentage > 0) {
    finalPrice = product.base_price * (1 - product.discount_percentage / 100);
  }

  const originalPrice = product.base_price;
  const hasDiscount =
    (product.sale_price && product.sale_price < product.base_price) || (product.discount_percentage && product.discount_percentage > 0);
  const totalPrice = finalPrice * item.quantity;

  // Obtener primera imagen
  const productImage = product.image_url || product.product_images?.[0]?.url || "/placeholder-glasses.jpg";
  const stock = product.stock_quantity ?? 0;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) return; // Límite máximo

    setLocalQuantity(newQuantity);
    updateQuantity({ cartItemId: item.id, quantity: newQuantity });
  };

  const handleInputChange = (value: string) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity >= 1 && quantity <= 10) {
      handleQuantityChange(quantity);
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Imagen del producto */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-glasses.jpg";
                }}
              />
            </div>
          </div>

          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm md:text-base line-clamp-1">{product.name}</h3>

                {product.brand?.name && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {product.brand?.name}
                  </Badge>
                )}

                {/* Información adicional */}
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {product.sku && <div>SKU: {product.sku}</div>}
                  {product.frame_style && <div>Estilo: {product.frame_style}</div>}
                  {product.frame_color && <div>Color: {product.frame_color}</div>}
                  {product.gender && <div>Para: {product.gender}</div>}
                </div>

                {/* Prescripción si existe */}
                {item.prescription_details && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      Con prescripción
                    </Badge>
                  </div>
                )}

                {/* Instrucciones especiales */}
                {item.special_instructions && <div className="mt-1 text-xs text-muted-foreground">Nota: {item.special_instructions}</div>}
              </div>

              {/* Precio y controles */}
              <div className="flex flex-col items-end gap-3">
                {/* Precio */}
                <div className="text-right">
                  {hasDiscount ? (
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-primary">{formatCartPrice(finalPrice)}</div>
                      <div className="text-sm text-muted-foreground line-through">{formatCartPrice(originalPrice)}</div>
                      {product.discount_percentage && (
                        <Badge variant="destructive" className="text-xs">
                          -{product.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-primary">{formatCartPrice(finalPrice)}</div>
                  )}
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(localQuantity - 1)}
                    disabled={localQuantity <= 1 || isUpdatingQuantity}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={localQuantity}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={isUpdatingQuantity}
                    className="w-16 h-8 text-center"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(localQuantity + 1)}
                    disabled={localQuantity >= 10 || isUpdatingQuantity}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Precio total del item */}
                <div className="text-lg font-bold">{formatCartPrice(totalPrice)}</div>

                {/* Botón eliminar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                  disabled={isRemovingFromCart}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stock warning */}
        {stock <= 5 && stock > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Solo quedan {stock} unidades disponibles</span>
            </div>
          </div>
        )}

        {/* Out of stock */}
        {stock <= 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Producto agotado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
