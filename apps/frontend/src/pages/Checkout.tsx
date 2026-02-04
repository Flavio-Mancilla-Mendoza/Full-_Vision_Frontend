// src/pages/Checkout.tsx - Página de checkout
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { useUser } from "@/hooks/useAuthCognito";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingBag, CreditCard, Truck, CheckCircle2, AlertCircle, ArrowLeft, Circle } from "lucide-react";
import SEO from "@/components/common/SEO";
import { S3Image } from "@/components/common/S3Image";
import { cn } from "@/lib/utils";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { cartItems, cartSummary, isLoading: cartLoading } = useOptimizedAuthCart();
  const createOrderMutation = useCreateOrder();

  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    dni: "",
    address: "",
    city: "",
    postal_code: "",
  });
  const [customerNotes, setCustomerNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const isSubmitting = Boolean(
    (createOrderMutation as any)?.isPending ?? (createOrderMutation as any)?.isLoading ?? (createOrderMutation as any)?.isMutating,
  );

  // Redirigir si no está autenticado o no hay items
  useEffect(() => {
    if (!cartLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (!cartItems || cartItems.length === 0) {
        navigate("/cart");
      }
    }
  }, [isAuthenticated, cartItems, cartLoading, navigate]);

  // Pre-llenar con datos del usuario
  useEffect(() => {
    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        name: user.full_name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const validateShippingInfo = () => {
    const errors: Record<string, string> = {};

    if (!shippingInfo.name.trim()) errors.name = "El nombre es requerido";
    if (!shippingInfo.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      errors.email = "Email inválido";
    }
    if (!shippingInfo.phone.trim()) errors.phone = "El teléfono es requerido";

    // Validar DNI si es retiro en tienda
    if (deliveryMethod === "pickup") {
      if (!shippingInfo.dni.trim()) {
        errors.dni = "El DNI es requerido para retiro en tienda";
      } else if (!/^\d{8}$/.test(shippingInfo.dni)) {
        errors.dni = "El DNI debe tener 8 dígitos";
      }
    }

    // Solo validar dirección si es envío a domicilio
    if (deliveryMethod === "shipping") {
      if (!shippingInfo.address.trim()) errors.address = "La dirección es requerida";
      if (!shippingInfo.city.trim()) errors.city = "La ciudad es requerida";
      if (!shippingInfo.postal_code.trim()) errors.postal_code = "El código postal es requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShippingInfo()) {
      setStep("payment");
    }
  };

  const handleConfirmOrder = async () => {
    if (!user?.id || !cartItems) return;

    setOrderError(null);
    try {
      const order = await createOrderMutation.mutateAsync({
        userId: user.id,
        cartItems,
        shippingInfo,
        paymentMethod,
        customerNotes: customerNotes || undefined,
      });

      // Si el método de pago es Mercado Pago, redirigir a su plataforma
      if (paymentMethod === "mercadopago") {
        const { createMercadoPagoPreference } = await import("../services/mercadopago");

        const items = cartItems.map((item) => ({
          title: item.product?.name || "Producto",
          quantity: item.quantity,
          unit_price: item.product?.sale_price || item.product?.base_price || 0,
        }));

        const preference = await createMercadoPagoPreference({
          orderId: order.id,
          orderNumber: order.order_number,
          items,
          totalAmount: cartSummary?.total || 0,
          payer: {
            email: shippingInfo.email || user.email || "sin-email@example.com",
            name: shippingInfo.name || user.full_name || "Cliente",
            phone: shippingInfo.phone || undefined,
          },
        });

        // Redirigir a Mercado Pago (siempre verificar que exista el init_point)
        if (preference && preference.init_point) {
          window.location.href = preference.init_point;
        } else {
          setOrderError("No se pudo obtener el enlace de pago. Intenta nuevamente.");
          navigate(`/order-confirmation/${order.id}`);
        }
      } else {
        // Redirigir a página de confirmación con el número de orden
        navigate(`/order-confirmation/${order.id}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setOrderError("Error al crear el pedido. Intenta nuevamente más tarde.");
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Checkout - Full Vision" description="Finaliza tu compra en Full Vision Óptica" />

      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/cart")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Button>
          <h1 className="text-3xl font-bold">Finalizar Compra</h1>
          <p className="text-muted-foreground">Completa tu pedido en pocos pasos</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <StepIndicator step={1} label="Envío" isActive={step === "shipping"} isCompleted={step !== "shipping"} />
            <div className="h-px w-16 bg-gray-300" />
            <StepIndicator step={2} label="Pago" isActive={step === "payment"} isCompleted={step === "confirm"} />
            <div className="h-px w-16 bg-gray-300" />
            <StepIndicator step={3} label="Confirmar" isActive={step === "confirm"} isCompleted={false} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Info */}
            {step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Información de Envío
                  </CardTitle>
                  <CardDescription>¿Dónde quieres recibir tu pedido?</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    {/* Delivery Method Selection */}
                    <div className="space-y-3">
                      <Label>Método de entrega *</Label>
                      <RadioGroupPrimitive.Root
                        value={deliveryMethod}
                        onValueChange={(value: "shipping" | "pickup") => setDeliveryMethod(value)}
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
                            {cartSummary && cartSummary.shipping > 0 && (
                              <p className="text-sm text-primary mt-1">Costo de envío: S/ {(cartSummary?.shipping || 0).toFixed(2)}</p>
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
                            <p className="text-sm font-medium mt-2">📍 Av. Petit Thouars 1821 ,Lince 15046 Lima, Perú</p>
                            <p className="text-xs text-muted-foreground mt-1">Lun - Sáb: 9:00 AM - 6:00 PM</p>
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
                            onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
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
                            onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
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
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
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
                              setShippingInfo({ ...shippingInfo, dni: value });
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
                              onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
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
                                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
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
                                onChange={(e) => setShippingInfo({ ...shippingInfo, postal_code: e.target.value })}
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
            )}

            {/* Step 2: Payment Method */}
            {step === "payment" && (
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
                  <RadioGroupPrimitive.Root value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupPrimitive.Item
                        value="mercadopago"
                        id="mercadopago"
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                          <Circle className="h-2.5 w-2.5 fill-current text-current" />
                        </RadioGroupPrimitive.Indicator>
                      </RadioGroupPrimitive.Item>
                      <Label htmlFor="mercadopago" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Mercado Pago</div>
                        <div className="text-sm text-muted-foreground">Tarjeta, transferencia o saldo en MP</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupPrimitive.Item
                        value="yape"
                        id="yape"
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                          <Circle className="h-2.5 w-2.5 fill-current text-current" />
                        </RadioGroupPrimitive.Indicator>
                      </RadioGroupPrimitive.Item>
                      <Label htmlFor="yape" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Yape / Plin</div>
                        <div className="text-sm text-muted-foreground">Pago por aplicación móvil</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupPrimitive.Item
                        value="transfer"
                        id="transfer"
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                          <Circle className="h-2.5 w-2.5 fill-current text-current" />
                        </RadioGroupPrimitive.Indicator>
                      </RadioGroupPrimitive.Item>
                      <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Transferencia Bancaria</div>
                        <div className="text-sm text-muted-foreground">Depósito o transferencia</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupPrimitive.Item
                        value="cod"
                        id="cod"
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                          <Circle className="h-2.5 w-2.5 fill-current text-current" />
                        </RadioGroupPrimitive.Indicator>
                      </RadioGroupPrimitive.Item>
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Pago Contra Entrega</div>
                        <div className="text-sm text-muted-foreground">Paga cuando recibas tu pedido</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupPrimitive.Item
                        value="store"
                        id="store"
                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                          <Circle className="h-2.5 w-2.5 fill-current text-current" />
                        </RadioGroupPrimitive.Indicator>
                      </RadioGroupPrimitive.Item>
                      <Label htmlFor="store" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Pago en Tienda</div>
                        <div className="text-sm text-muted-foreground">Recoge y paga en nuestra óptica</div>
                      </Label>
                    </div>
                  </RadioGroupPrimitive.Root>

                  {paymentMethod === "mercadopago" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Serás redirigido a Mercado Pago para completar el pago de forma segura con tarjeta, transferencia o tu saldo
                        disponible.
                      </AlertDescription>
                    </Alert>
                  )}

                  {paymentMethod === "yape" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Te enviaremos los datos para realizar el pago por Yape o Plin una vez confirmes el pedido.
                      </AlertDescription>
                    </Alert>
                  )}

                  {paymentMethod === "transfer" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Te enviaremos los datos bancarios para realizar la transferencia.</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas del pedido (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="¿Alguna indicación especial para tu pedido?"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep("shipping")} className="flex-1">
                      Volver
                    </Button>
                    <Button onClick={() => setStep("confirm")} className="flex-1">
                      Revisar Pedido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirm Order */}
            {step === "confirm" && (
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
                    <h3 className="font-semibold mb-3">{deliveryMethod === "pickup" ? "Información de Retiro" : "Información de Envío"}</h3>
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
                            <p className="mt-1">Av. Petit Thouars 1821, Lince 15046</p>
                            <p className="text-muted-foreground">Lima, Perú</p>
                            <p className="text-xs text-muted-foreground mt-2">Horario: Lun - Sáb: 9:00 AM - 6:00 PM</p>
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
                    <Button variant="link" onClick={() => setStep("shipping")} className="mt-2 p-0 h-auto">
                      Editar
                    </Button>
                  </div>

                  <Separator />

                  {/* Payment Method Summary */}
                  <div>
                    <h3 className="font-semibold mb-3">Método de Pago</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm">
                      <p>
                        {paymentMethod === "mercadopago" && "Mercado Pago"}
                        {paymentMethod === "yape" && "Yape / Plin"}
                        {paymentMethod === "transfer" && "Transferencia Bancaria"}
                        {paymentMethod === "cod" && "Pago Contra Entrega"}
                        {paymentMethod === "store" && "Pago en Tienda"}
                      </p>
                    </div>
                    <Button variant="link" onClick={() => setStep("payment")} className="mt-2 p-0 h-auto">
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
                    <Button variant="outline" onClick={() => setStep("payment")} className="flex-1">
                      Volver
                    </Button>
                    <Button onClick={handleConfirmOrder} disabled={isSubmitting} className="flex-1" size="lg">
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
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems?.map((item) => (
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
                      <span>S/ {(cartSummary?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%)</span>
                      <span>S/ {(cartSummary?.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span>{(cartSummary?.shipping || 0) === 0 ? "GRATIS" : `S/ ${(cartSummary?.shipping || 0).toFixed(2)}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>S/ {(cartSummary?.total || 0).toFixed(2)}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ step, label, isActive, isCompleted }: { step: number; label: string; isActive: boolean; isCompleted: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step}
      </div>
      <span className={`text-sm ${isActive ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
