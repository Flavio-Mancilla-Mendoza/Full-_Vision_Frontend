// src/pages/OrderConfirmation.tsx - Página de confirmación de orden
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/services/orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Package, Home, ShoppingBag, Clock, XCircle } from "lucide-react";
import SEO from "@/components/common/SEO";
import type { Order } from "@/types";

type PaymentQueryStatus = "success" | "pending" | "failure" | null;

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentStatus = (searchParams.get("payment") as PaymentQueryStatus) || null;

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: paymentStatus === "pending" ? 10_000 : false, // Poll while payment pending
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Pedido no encontrado</CardTitle>
            <CardDescription>No pudimos encontrar este pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SEO title="Pedido Confirmado - Full Vision" description="Tu pedido ha sido confirmado exitosamente" />

      <div className="container max-w-3xl mx-auto px-4">
        {/* Payment Status Banner */}
        {paymentStatus === "failure" && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>El pago no se completó.</strong> Tu pedido fue creado pero el pago falló.
              Puedes intentar pagar nuevamente desde &quot;Mis Pedidos&quot; o contactarnos para asistencia.
            </AlertDescription>
          </Alert>
        )}
        {paymentStatus === "pending" && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>Pago en proceso.</strong> Tu pago está siendo verificado.
              Esta página se actualizará automáticamente cuando se confirme.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            paymentStatus === "failure" ? "bg-red-100" : paymentStatus === "pending" ? "bg-yellow-100" : "bg-green-100"
          }`}>
            {paymentStatus === "failure" ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : paymentStatus === "pending" ? (
              <Clock className="w-10 h-10 text-yellow-600" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {paymentStatus === "failure" ? "Pedido Creado — Pago Pendiente" :
             paymentStatus === "pending" ? "Pedido Recibido — Verificando Pago" :
             "¡Pedido Confirmado!"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {paymentStatus === "failure"
              ? "Tu pedido fue registrado. Completa el pago para que podamos procesarlo."
              : paymentStatus === "pending"
              ? "Estamos verificando tu pago. Te notificaremos cuando se confirme."
              : "Gracias por tu compra. Hemos recibido tu pedido correctamente."}
          </p>
        </div>

        {/* Order Number */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Package className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Número de orden:</strong> {order.order_number}
            <br />
            <span className="text-sm">Guarda este número para hacer seguimiento de tu pedido</span>
          </AlertDescription>
        </Alert>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3">Productos</h3>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-3 border-b last:border-0">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded">
                      {item.product?.product_images && item.product.product_images.length > 0 && (
                        <img
                          src={item.product.product_images[0]?.url || ""}
                          alt={item.product?.name || "Producto"}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.product?.sku}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      <p className="font-semibold mt-1">S/ {item.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>S/ {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IGV (18%)</span>
                <span>S/ {(order.tax_amount ?? 0).toFixed(2)}</span>
              </div>
              {order.shipping_address && (
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>{!order.shipping_amount ? "GRATIS" : `S/ ${order.shipping_amount.toFixed(2)}`}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>S/ {order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">{order.shipping_address ? "Información de Envío" : "Información de Retiro"}</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                <p>
                  <strong>Nombre:</strong> {order.shipping_name}
                </p>
                <p>
                  <strong>Email:</strong> {order.shipping_email}
                </p>
                <p>
                  <strong>Teléfono:</strong> {order.shipping_phone}
                </p>
                {order.shipping_address ? (
                  <>
                    <p>
                      <strong>Dirección:</strong> {order.shipping_address}
                    </p>
                    <p>
                      <strong>Ciudad:</strong> {order.shipping_city} - {order.shipping_postal_code}
                    </p>
                  </>
                ) : (
                  <div className="mt-3 pt-3 border-t">
                    <p className="font-semibold text-primary">📍 Punto de Retiro:</p>
                    <p className="mt-1">Av. Lima 1912 Prd. 10 1/2 Jose Galvez - V.M.T.</p>
                    <p className="text-muted-foreground">Lima, Perú</p>
                    <p className="text-xs text-muted-foreground mt-2">Horario: Lun - Sáb: 10:00 AM - 7:00 PM</p>
                    <p className="text-xs text-amber-600 mt-2">⚠️ No olvides traer tu DNI para retirar tu pedido</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Método de Pago</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p>{order.admin_notes || "No especificado"}</p>
                {order.payment_status && (
                  <p className="mt-2">
                    <strong>Estado del pago:</strong>{" "}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.payment_status === "approved" ? "bg-green-100 text-green-800" :
                      order.payment_status === "pending" || order.payment_status === "in_process" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {order.payment_status === "approved" ? "Aprobado" :
                       order.payment_status === "pending" ? "Pendiente" :
                       order.payment_status === "in_process" ? "En proceso" :
                       order.payment_status === "rejected" ? "Rechazado" :
                       order.payment_status}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Confirmación por email</p>
                <p className="text-sm text-muted-foreground">
                  Te enviaremos un email a {order.shipping_email} con los detalles de tu pedido.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Preparación del pedido</p>
                <p className="text-sm text-muted-foreground">Nuestro equipo preparará tu pedido con mucho cuidado.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Envío o recojo</p>
                <p className="text-sm text-muted-foreground">Te notificaremos cuando tu pedido esté en camino o listo para recoger.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to="/mis-pedidos">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ver mis pedidos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
