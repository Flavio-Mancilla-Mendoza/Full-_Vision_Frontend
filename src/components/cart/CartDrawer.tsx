// src/components/cart/CartDrawer.tsx - Panel deslizante del carrito
import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, X, ArrowRight, Package, Plus, Minus, Trash2 } from "lucide-react";
import { useOptimizedAuthCart as useAuthCart } from "@/hooks/useOptimizedAuthCart";
import { useCartDrawer } from "@/hooks/useCartDrawer";
import { CartItemWithProductLocal } from "@/services/cart";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CartDrawerProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CartDrawer = React.forwardRef<HTMLDivElement, CartDrawerProps>(({ children, open, onOpenChange }, ref) => {
  const navigate = useNavigate();
  const { cartItems, cartSummary, updateQuantity, removeFromCart, isAuthenticated } = useAuthCart();
  const { isOpen: globalIsOpen, setOpen: setGlobalOpen } = useCartDrawer();

  // Si se pasan props de control, las usamos, sino usamos el estado global
  const isOpen = open !== undefined ? open : globalIsOpen;
  const setIsOpen = onOpenChange || setGlobalOpen;

  const hasItems = cartItems && Array.isArray(cartItems) && cartItems.length > 0;
  const itemCount = cartSummary?.totalItems || 0;

  const handleViewFullCart = () => {
    setIsOpen(false);
    navigate("/cart");
  };

  const handleCheckout = () => {
    setIsOpen(false);
    // TODO: Implementar checkout directo o navegar a checkout
    navigate("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}

      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Tu Carrito
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>Revisa los productos que has agregado y gestiona tu carrito de compras.</SheetDescription>
        </SheetHeader>

        {!isAuthenticated ? (
          // Usuario no autenticado - mostrar mensaje de login
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Inicia sesión para usar el carrito</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Para agregar productos al carrito y realizar compras, necesitas crear una cuenta o iniciar sesión
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/login");
                }}
                className="w-full"
              >
                Iniciar sesión
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/register");
                }}
                className="w-full"
              >
                Crear cuenta
              </Button>
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full">
                Continuar explorando
              </Button>
            </div>
          </div>
        ) : !hasItems ? (
          // Carrito vacío
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tu carrito está vacío</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Explora nuestros productos y encuentra las gafas perfectas para ti</p>
            <Button onClick={() => setIsOpen(false)} className="w-full max-w-xs">
              Explorar productos
            </Button>
          </div>
        ) : (
          // Carrito con productos
          <div className="flex-1 flex flex-col">
            {/* Lista de productos */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {cartItems &&
                  Array.isArray(cartItems) &&
                  cartItems.map((item) => (
                    <CartDrawerItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={(productId: string, quantity: number) => updateQuantity({ cartItemId: item.id, quantity })}
                      onRemove={(productId: string) => removeFromCart(item.id)}
                    />
                  ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Resumen */}
            {cartSummary && (
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cartSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGV (18%):</span>
                    <span>{formatCurrency(cartSummary.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span>
                      {cartSummary.shipping === 0 ? (
                        <span className="text-green-600 font-medium">Gratis</span>
                      ) : (
                        formatCurrency(cartSummary.shipping)
                      )}
                    </span>
                  </div>
                  {cartSummary.shipping === 0 && cartSummary.subtotal >= 300 && (
                    <p className="text-xs text-green-600">✓ Envío gratis por compras mayores a S/ 300</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(cartSummary.total)}</span>
                </div>

                {/* Botones de acción */}
                <div className="space-y-2 pt-2">
                  <Button onClick={handleCheckout} className="w-full" size="lg">
                    Proceder al pago
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button variant="outline" onClick={handleViewFullCart} className="w-full">
                    Ver carrito completo
                  </Button>
                </div>

                {/* Aviso para usuarios no registrados */}
                {!isAuthenticated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 text-center">
                      💡 <strong>Tip:</strong> Crea una cuenta para guardar tu carrito y obtener ofertas exclusivas
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

CartDrawer.displayName = "CartDrawer";

// Componente para cada item en el drawer
interface CartDrawerItemProps {
  item: CartItemWithProductLocal;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartDrawerItem({ item, onUpdateQuantity, onRemove }: CartDrawerItemProps) {
  const product = item.product;
  const productImage = product?.image_url || product?.product_images?.[0]?.url || "/placeholder-glasses.jpg";

  // Calcular precio final con descuento
  let finalPrice = product?.base_price || 0;
  if (product?.sale_price) {
    finalPrice = product.sale_price;
  } else if (product?.discount_percentage && product.discount_percentage > 0) {
    finalPrice = (product?.base_price || 0) * (1 - product.discount_percentage / 100);
  }

  return (
    <div className="flex gap-3 py-3">
      {/* Imagen del producto */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <img
          src={productImage}
          alt={product?.name || "Producto"}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-glasses.jpg";
          }}
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2 mb-1">{product?.name || "Producto"}</h4>

        {product?.brand?.name && <p className="text-xs text-muted-foreground mb-2">{product.brand.name}</p>}

        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{formatCurrency(finalPrice)}</span>

          {/* Controles de cantidad */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onUpdateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
            >
              <Minus className="w-3 h-3" />
            </Button>

            <span className="mx-2 text-sm font-medium min-w-[2ch] text-center">{item.quantity}</span>

            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            >
              <Plus className="w-3 h-3" />
            </Button>

            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-1 text-destructive" onClick={() => onRemove(item.product_id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Precio total del item */}
        <div className="text-xs text-muted-foreground mt-1">Total: {formatCurrency(finalPrice * item.quantity)}</div>
      </div>
    </div>
  );
}

export default CartDrawer;
