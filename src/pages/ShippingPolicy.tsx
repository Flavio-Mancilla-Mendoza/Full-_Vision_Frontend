import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck, MapPin, Clock, Package } from "lucide-react";

export default function ShippingPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center">Política de Envíos</CardTitle>
          <p className="text-center text-muted-foreground mt-2">Información sobre tiempos, costos y opciones de entrega</p>
        </CardHeader>
        <CardContent className="space-y-8">
          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Opciones de Entrega</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entrega a Domicilio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Entrega en la dirección que nos indiques</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Lima Metropolitana: 2-5 días hábiles</li>
                    <li>Provincias: 5-10 días hábiles</li>
                    <li>Seguimiento en tiempo real</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recojo en Tienda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Retira tu pedido en nuestra tienda</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Disponible en 24-48 horas</li>
                    <li>Sin costo adicional</li>
                    <li>Horario: Lun-Sáb 10:00am-7:00pm</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Cobertura y Costos</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Lima Metropolitana</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>
                    Pedidos mayores a S/ 150: <strong>Envío GRATIS</strong>
                  </li>
                  <li>Pedidos menores a S/ 150: S/ 10</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Provincias</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Costo calculado según destino y peso</li>
                  <li>Rango: S/ 15 - S/ 35</li>
                  <li>Se muestra antes de finalizar la compra</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Tiempos de Procesamiento</h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm">Los pedidos se procesan de la siguiente manera:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>
                  <strong>Productos en stock:</strong> Procesamiento inmediato, envío en 24-48 horas
                </li>
                <li>
                  <strong>Productos graduados:</strong> 3-5 días hábiles adicionales para fabricación
                </li>
                <li>
                  <strong>Productos bajo pedido:</strong> 15-30 días hábiles según disponibilidad
                </li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Seguimiento de Pedido</h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm">Recibirás notificaciones en cada etapa:</p>
              <ol className="list-decimal pl-6 space-y-2 text-sm">
                <li>Pedido recibido y confirmado</li>
                <li>Pedido en proceso de preparación</li>
                <li>Pedido enviado (con código de seguimiento)</li>
                <li>Pedido en camino a tu destino</li>
                <li>Pedido entregado</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                Puedes rastrear tu pedido en tiempo real desde <strong>Mis Pedidos</strong> en tu cuenta.
              </p>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Información Adicional</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Documentos necesarios para recepción:</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>DNI del titular del pedido</li>
                  <li>Número de pedido (enviado por email)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">¿Qué pasa si no estoy en casa?</h3>
                <p className="text-sm text-muted-foreground">
                  El courier intentará entregar hasta 2 veces. Si no hay respuesta, el pedido quedará disponible para recojo en tienda o
                  agencia del courier.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Paquetes dañados:</h3>
                <p className="text-sm text-muted-foreground">
                  Si recibes un paquete dañado, NO lo aceptes y contáctanos inmediatamente. Enviaremos un reemplazo sin costo adicional.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">¿Tienes dudas?</h2>
            <p className="text-sm text-muted-foreground">
              Contáctanos en <strong>fullvision_optica@outlook.es</strong> o al <strong>+51 930639641</strong>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
