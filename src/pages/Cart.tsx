// src/pages/Cart.tsx - Página principal del carrito de compras
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import SEO from "@/components/common/SEO";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import GuestCartNotice from "@/components/cart/GuestCartNotice";
import { useCart as useAuthCart } from "@/hooks/cart";
import { useUser } from "@/hooks/auth";
import { ShoppingCart, ArrowLeft, Trash2, ShoppingBag, Heart, Package } from "lucide-react";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { cartItems, cartSummary, isLoading, clearCart, isClearingCart, isAuthenticated } = useAuthCart();

  const hasItems = cartItems && Array.isArray(cartItems) && cartItems.length > 0;
  const isEmpty = !hasItems;

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO title="Carrito - Full Vision" description="Carrito de compras - Full Vision Óptica" />
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Mi Carrito</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-16">
        <SEO title="Carrito vacío - Full Vision" description="Tu carrito de compras está vacío - Full Vision Óptica" />
        <div className="max-w-lg mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-8">Explora nuestra colección y encuentra los lentes perfectos para ti.</p>

          <div className="space-y-3 mb-8">
            <Button onClick={() => navigate("/")} className="w-full">
              <Package className="w-4 h-4 mr-2" />
              Explorar productos
            </Button>
            <Button variant="outline" onClick={() => navigate("/mis-citas")} className="w-full">
              <Heart className="w-4 h-4 mr-2" />
              Ver mis citas
            </Button>
          </div>

          {/* Suggestions */}
          <div className="text-left">
            <h3 className="font-semibold mb-3">¿Necesitas ayuda?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Agenda un examen de vista gratuito</li>
              <li>• Explora nuestros productos destacados</li>
              <li>• Contacta a nuestro equipo de asesores</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={`Carrito (${cartSummary?.totalItems || 0}) - Full Vision`}
        description="Revisa los productos en tu carrito y procede al pago - Full Vision Óptica"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mi Carrito</h1>
          {cartSummary && (
            <p className="text-muted-foreground mt-1">
              {cartSummary.totalItems} {cartSummary.totalItems === 1 ? "producto" : "productos"}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")} className="hidden md:flex">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuar comprando
          </Button>

          {hasItems && (
            <Button
              variant="outline"
              onClick={() => clearCart()}
              disabled={isClearingCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vaciar carrito
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {/* Guest notice - solo para usuarios no registrados */}
          {!isAuthenticated && hasItems && <GuestCartNotice className="mb-6" />}

          <div className="space-y-4">
            {cartItems && Array.isArray(cartItems) && cartItems.map((item) => <CartItem key={item.id} item={item} />)}
          </div>

          {/* Mobile continue shopping button */}
          <div className="mt-6 md:hidden">
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuar comprando
            </Button>
          </div>
        </div>

        {/* Cart summary */}
        <div className="lg:col-span-1">
          <CartSummary onCheckout={handleCheckout} />
        </div>
      </div>

      {/* Recommendations section */}
      {hasItems && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Te podría interesar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Productos relacionados con tu selección</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Ver productos relacionados
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trust indicators */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Envío seguro</h3>
          <p className="text-xs text-muted-foreground">Entrega en 3-5 días hábiles</p>
        </div>

        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Garantía de calidad</h3>
          <p className="text-xs text-muted-foreground">Productos certificados</p>
        </div>

        <div className="text-center p-4">
          <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Compra protegida</h3>
          <p className="text-xs text-muted-foreground">Pago 100% seguro</p>
        </div>
      </div>
    </div>
  );
}
