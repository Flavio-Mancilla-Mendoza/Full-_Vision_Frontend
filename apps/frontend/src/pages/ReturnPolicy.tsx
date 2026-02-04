import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, AlertCircle, CheckCircle } from "lucide-react";

export default function ReturnPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center">Política de Devoluciones y Cambios</CardTitle>
          <p className="text-center text-muted-foreground mt-2">Tu satisfacción es nuestra prioridad</p>
        </CardHeader>
        <CardContent className="space-y-8">
          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Condiciones Generales</h2>
            </div>
            <div className="space-y-3">
              <p className="text-sm">
                Aceptamos devoluciones y cambios dentro de los <strong>7 días calendario</strong> posteriores a la recepción del producto,
                siempre que cumplan las siguientes condiciones:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Producto en su empaque original, sin abrir ni usar</li>
                <li>Etiquetas y sellos de seguridad intactos</li>
                <li>Comprobante de compra (físico o digital)</li>
                <li>Producto en perfecto estado, sin rayones ni daños</li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-semibold">Productos Elegibles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ SÍ aceptamos devoluciones</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Lentes de sol sin uso</li>
                  <li>Monturas sin graduar</li>
                  <li>Accesorios sin abrir</li>
                  <li>Productos defectuosos o dañados</li>
                  <li>Productos incorrectos en tu pedido</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">❌ NO aceptamos devoluciones</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Lentes graduados o con medida</li>
                  <li>Productos personalizados</li>
                  <li>Productos usados o dañados por el cliente</li>
                  <li>Accesorios ya abiertos o utilizados</li>
                  <li>Productos sin empaque original</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Proceso de Devolución</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Contacta con nosotros</h3>
                  <p className="text-sm text-muted-foreground">
                    Envía un email a <strong>devoluciones@fullvision.pe</strong> o llama al <strong>+51 999 999 999</strong> indicando:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Número de pedido</li>
                    <li>Producto a devolver</li>
                    <li>Motivo de la devolución</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Recibe autorización</h3>
                  <p className="text-sm text-muted-foreground">
                    Te enviaremos un código de autorización de devolución (RMA) y las instrucciones de envío en un plazo de 24 horas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Envía el producto</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes enviarlo por courier a nuestra dirección o dejarlo en tienda. El costo de envío corre por cuenta del cliente,
                    excepto en caso de producto defectuoso o error nuestro.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Inspección y reembolso</h3>
                  <p className="text-sm text-muted-foreground">
                    Una vez recibido, inspeccionaremos el producto (1-3 días hábiles). Si cumple las condiciones, procesaremos el reembolso
                    o cambio en 5-7 días hábiles.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Métodos de Reembolso</h2>
            <div className="space-y-3">
              <p className="text-sm">El reembolso se realizará por el mismo método de pago utilizado:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>
                  <strong>Tarjeta de crédito/débito:</strong> 7-14 días hábiles según tu banco
                </li>
                <li>
                  <strong>Transferencia/Yape:</strong> 3-5 días hábiles a la cuenta indicada
                </li>
                <li>
                  <strong>Vale de compra:</strong> Disponible inmediatamente para nueva compra
                </li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Cambios</h2>
            <div className="space-y-3">
              <p className="text-sm">
                Si prefieres un cambio en lugar de devolución, puedes elegir otro producto de igual o mayor valor. Si el nuevo producto es
                de menor valor, te devolveremos la diferencia.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  💡 Cambios sin costo de envío adicional si es por defecto del producto
                </p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-semibold">Casos Especiales</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Producto Defectuoso</h3>
                <p className="text-sm text-muted-foreground">
                  Si recibes un producto con defectos de fabricación, te enviaremos un reemplazo sin costo adicional o reembolso completo,
                  incluyendo gastos de envío.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Pedido Incorrecto</h3>
                <p className="text-sm text-muted-foreground">
                  Si recibiste un producto diferente al solicitado, lo reemplazaremos sin costo y cubriremos todos los gastos de envío.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Garantía del Fabricante</h3>
                <p className="text-sm text-muted-foreground">
                  Los productos con garantía del fabricante siguen los términos específicos de cada marca. Te ayudaremos con el proceso de
                  garantía sin costo adicional.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">¿Necesitas ayuda?</h2>
            <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte. Contáctanos en:</p>
            <ul className="list-none pl-0 space-y-1 text-sm">
              <li>
                <strong>Email:</strong> devoluciones@fullvision.pe
              </li>
              <li>
                <strong>WhatsApp:</strong> +51 999 999 999
              </li>
              <li>
                <strong>Horario:</strong> Lun-Vie 9am-6pm, Sáb 10am-2pm
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
