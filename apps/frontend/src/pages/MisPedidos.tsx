// src/pages/MisPedidos.tsx - Página de historial de pedidos del cliente
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUserOrders } from "@/hooks/useOrders";
import { useUser } from "@/hooks/useAuthCognito";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, ShoppingBag, Eye, ArrowLeft, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import SEO from "@/components/common/SEO";
import type { Order, OrderItem } from "@/services/api";

// Tipo extendido para Order con campos adicionales de Supabase
interface ExtendedOrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  price: number;
  unit_price?: number;
  total_price?: number;
  product?: {
    name?: string;
    sku?: string;
    product_images?: { url: string }[];
  };
}

interface ExtendedOrder extends Omit<Order, "order_items"> {
  order_number?: string;
  subtotal?: number;
  tax_amount?: number;
  shipping_amount?: number;
  shipping_name?: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  customer_notes?: string;
  order_items?: ExtendedOrderItem[];
}

export default function MisPedidos() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: userLoading } = useUser();
  const { data, isLoading: queryLoading, isFetching, isSuccess } = useUserOrders();
  const orders = (data ?? []) as unknown as ExtendedOrder[];
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);

  // Consideramos que está cargando si:
  // 1. El usuario está cargando
  // 2. La query está en estado loading inicial
  // 3. Está fetching y aún no hay datos cargados exitosamente
  const isLoading = userLoading || queryLoading || (isFetching && !isSuccess);

  // Solo mostramos el mensaje de "no pedidos" cuando:
  // 1. NO está cargando
  // 2. NO está fetching
  // 3. La query fue exitosa (se completó al menos una vez)
  // 4. Y no hay pedidos
  const showEmptyState = !isLoading && !isFetching && isSuccess && orders.length === 0;

  // Redirigir si no está autenticado: ejecutar después del primer render
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, userLoading, navigate]);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { icon: Clock, variant: "secondary" as const, label: "Pendiente", color: "text-yellow-600" },
      confirmed: { icon: CheckCircle2, variant: "default" as const, label: "Confirmado", color: "text-blue-600" },
      processing: { icon: Package, variant: "default" as const, label: "Procesando", color: "text-blue-600" },
      ready_for_pickup: { icon: ShoppingBag, variant: "default" as const, label: "Listo para Recojo", color: "text-green-600" },
      shipped: { icon: Truck, variant: "default" as const, label: "Enviado", color: "text-green-600" },
      delivered: { icon: CheckCircle2, variant: "default" as const, label: "Entregado", color: "text-green-600" },
      cancelled: { icon: XCircle, variant: "destructive" as const, label: "Cancelado", color: "text-red-600" },
    };

    const item = config[status as keyof typeof config] || {
      icon: Package,
      variant: "outline" as const,
      label: status,
      color: "text-gray-600",
    };
    const Icon = item.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${item.color}`} />
        <Badge variant={item.variant}>{item.label}</Badge>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Mis Pedidos - Full Vision" description="Revisa el historial de tus pedidos en Full Vision" />

      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/profile")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mi perfil
          </Button>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-muted-foreground">Revisa el estado de tus pedidos y compras anteriores</p>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {/* Loading skeletons */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <div className="h-16 w-16 bg-gray-200 rounded"></div>
                    <div className="h-16 w-16 bg-gray-200 rounded"></div>
                    <div className="h-16 w-16 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showEmptyState ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Cuando realices un pedido, aparecerá aquí para que puedas hacer seguimiento
              </p>
              <Button asChild>
                <Link to="/productos">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Ir a comprar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: ExtendedOrder) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Orden {order.order_number || order.id}</CardTitle>
                      <CardDescription>
                        Realizada el{" "}
                        {new Date(order.created_at || "").toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      {getStatusBadge(order.status)}
                      <p className="text-lg font-bold">S/ {(order.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items Preview */}
                  <div className="flex flex-wrap gap-3">
                    {order.order_items &&
                      order.order_items.length > 0 &&
                      order.order_items.slice(0, 3).map((item: ExtendedOrderItem) => (
                        <div key={item.id} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
                          {item.product?.product_images && item.product.product_images.length > 0 && (
                            <img
                              src={item.product.product_images[0].url}
                              alt={item.product.name || "Producto"}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="text-sm">
                            <p className="font-medium truncate max-w-[150px]">{item.product?.name || "Producto"}</p>
                            <p className="text-muted-foreground">Cant: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    {order.order_items && order.order_items.length > 3 && (
                      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2 px-4 text-sm text-muted-foreground">
                        +{order.order_items.length - 3} más
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalles del Pedido</DialogTitle>
                          <DialogDescription>Orden {order.order_number || order.id}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Status */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Estado actual</p>
                              <div className="mt-1">{getStatusBadge(order.status)}</div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-2xl font-bold mt-1">S/ {(order.total_amount || 0).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div>
                            <h3 className="font-semibold mb-3">Productos</h3>
                            <div className="space-y-3">
                              {order.order_items &&
                                order.order_items.length > 0 &&
                                order.order_items.map((item: ExtendedOrderItem) => (
                                  <div key={item.id} className="flex gap-4 pb-3 border-b last:border-0">
                                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded">
                                      {item.product?.product_images && item.product.product_images.length > 0 && (
                                        <img
                                          src={item.product.product_images[0].url}
                                          alt={item.product.name || "Producto"}
                                          className="w-full h-full object-cover rounded"
                                        />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">{item.product?.name || "Producto"}</p>
                                      <p className="text-sm text-muted-foreground">SKU: {item.product?.sku || "N/A"}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Cantidad: {item.quantity} x S/ {(item.unit_price || item.price || 0).toFixed(2)}
                                      </p>
                                      <p className="font-semibold mt-1">
                                        S/ {(item.total_price || item.quantity * (item.unit_price || item.price || 0)).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Price Summary */}
                          <div className="space-y-2 pt-4 border-t">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal</span>
                              <span>S/ {(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>IGV (18%)</span>
                              <span>S/ {(order.tax_amount || 0).toFixed(2)}</span>
                            </div>
                            {order.shipping_address && (
                              <div className="flex justify-between text-sm">
                                <span>Envío</span>
                                <span>
                                  {(order.shipping_amount || 0) === 0 ? "GRATIS" : `S/ ${(order.shipping_amount || 0).toFixed(2)}`}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                              <span>Total</span>
                              <span>S/ {(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Shipping Info */}
                          <div className="pt-4 border-t">
                            <h3 className="font-semibold mb-3">
                              {order.shipping_address ? "Información de Envío" : "Información de Retiro"}
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                              <p>
                                <strong>Nombre:</strong> {order.shipping_name || "N/A"}
                              </p>
                              <p>
                                <strong>Email:</strong> {order.shipping_email || order.email || "N/A"}
                              </p>
                              <p>
                                <strong>Teléfono:</strong> {order.shipping_phone || "N/A"}
                              </p>
                              {order.shipping_address ? (
                                <>
                                  <p>
                                    <strong>Dirección:</strong> {order.shipping_address}
                                  </p>
                                  <p>
                                    <strong>Ciudad:</strong> {order.shipping_city || "N/A"}{" "}
                                    {order.shipping_postal_code ? `- ${order.shipping_postal_code}` : ""}
                                  </p>
                                </>
                              ) : (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="font-semibold text-primary">📍 Punto de Retiro:</p>
                                  <p className="mt-1">Av. Petit Thouars 1821, Lince 15046</p>
                                  <p className="text-muted-foreground">Lima, Perú</p>
                                  <p className="text-xs text-muted-foreground mt-2">Horario: Lun - Sáb: 9:00 AM - 6:00 PM</p>
                                  <p className="text-xs text-amber-600 mt-2">⚠️ No olvides traer tu DNI para retirar tu pedido</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Customer Notes */}
                          {order.customer_notes && (
                            <div className="pt-4 border-t">
                              <h3 className="font-semibold mb-2">Tus Notas</h3>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">{order.customer_notes}</div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {order.status === "delivered" && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/productos`}>
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          Comprar de nuevo
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
