// src/pages/Checkout.tsx - Página de checkout (modularizada)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { useUser } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/common/SEO";
import {
  StepIndicator,
  ShippingForm,
  PaymentMethodSelector,
  OrderConfirmStep,
  OrderSidebar,
  validateShippingInfo,
  INITIAL_SHIPPING_INFO,
  type CheckoutStep,
  type DeliveryMethod,
  type PaymentMethodType,
  type ShippingInfo,
} from "@/components/checkout";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { cartItems, cartSummary, isLoading: cartLoading } = useOptimizedAuthCart();
  const createOrderMutation = useCreateOrder();

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("mercadopago");
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(INITIAL_SHIPPING_INFO);
  const [customerNotes, setCustomerNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const isSubmitting = createOrderMutation.isPending;

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

  const handleShippingSubmit = () => {
    const errors = validateShippingInfo(shippingInfo, deliveryMethod);
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
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
      // El Lambda de MP consulta items y precios de la BD — no confiamos en el frontend
      if (paymentMethod === "mercadopago") {
        const { createMercadoPagoPreference } = await import("../services/mercadopago");

        const preference = await createMercadoPagoPreference({
          orderId: order.id,
          payer: {
            email: shippingInfo.email || user.email || "sin-email@example.com",
            name: shippingInfo.name || user.full_name || "Cliente",
            phone: shippingInfo.phone || undefined,
          },
        });

        if (preference && preference.init_point) {
          window.location.href = preference.init_point;
        } else {
          setOrderError("No se pudo obtener el enlace de pago. Intenta nuevamente.");
          navigate(`/order-confirmation/${order.id}`);
        }
      } else {
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
            {step === "shipping" && (
              <ShippingForm
                shippingInfo={shippingInfo}
                deliveryMethod={deliveryMethod}
                formErrors={formErrors}
                shippingCost={cartSummary?.shipping}
                onShippingInfoChange={setShippingInfo}
                onDeliveryMethodChange={setDeliveryMethod}
                onSubmit={handleShippingSubmit}
              />
            )}

            {step === "payment" && (
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                customerNotes={customerNotes}
                orderError={orderError}
                onPaymentMethodChange={setPaymentMethod}
                onCustomerNotesChange={setCustomerNotes}
                onBack={() => setStep("shipping")}
                onContinue={() => setStep("confirm")}
              />
            )}

            {step === "confirm" && (
              <OrderConfirmStep
                shippingInfo={shippingInfo}
                deliveryMethod={deliveryMethod}
                paymentMethod={paymentMethod}
                customerNotes={customerNotes}
                isSubmitting={isSubmitting}
                onEditShipping={() => setStep("shipping")}
                onEditPayment={() => setStep("payment")}
                onBack={() => setStep("payment")}
                onConfirm={handleConfirmOrder}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSidebar cartItems={cartItems || []} cartSummary={cartSummary} />
          </div>
        </div>
      </div>
    </div>
  );
}
