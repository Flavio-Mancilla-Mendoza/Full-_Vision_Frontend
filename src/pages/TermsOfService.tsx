import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center">Términos y Condiciones de Servicio</CardTitle>
          <p className="text-center text-muted-foreground mt-2">Última actualización: 23 de diciembre de 2025</p>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base max-w-none">
          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar el sitio web de Full Vision, usted acepta estar sujeto a estos Términos y Condiciones de Servicio. Si no
              está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro sitio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
            <p>Full Vision ofrece servicios de venta de productos ópticos, incluyendo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Lentes de sol y ópticos de diversas marcas</li>
              <li>Accesorios relacionados con productos ópticos</li>
              <li>Sistema de reserva de citas para exámenes visuales</li>
              <li>Servicio de venta en línea con entrega a domicilio o recojo en tienda</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Registro de Usuario</h2>
            <p>
              Para realizar compras, es necesario crear una cuenta proporcionando información veraz y actualizada. Usted es responsable de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mantener la confidencialidad de su contraseña</li>
              <li>Todas las actividades que ocurran bajo su cuenta</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Precios y Pagos</h2>
            <p>
              Los precios mostrados están en Soles Peruanos (S/) e incluyen IGV. Nos reservamos el derecho de modificar precios sin previo
              aviso. Formas de pago aceptadas:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transferencias bancarias</li>
              <li>Yape / Plin</li>
              <li>Pago en tienda (efectivo o tarjeta)</li>
              <li>Tarjetas de crédito/débito (cuando esté disponible)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Envíos y Entregas</h2>
            <p>Ofrecemos las siguientes opciones de entrega:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Entrega a domicilio:</strong> 2-5 días hábiles en Lima Metropolitana
              </li>
              <li>
                <strong>Recojo en tienda:</strong> Disponible 24-48 horas después de la confirmación
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Política de Devoluciones</h2>
            <p>Aceptamos devoluciones y cambios bajo estas condiciones:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dentro de los 7 días calendario posteriores a la recepción</li>
              <li>Producto en empaque original, sin usar y con etiquetas</li>
              <li>Presentar comprobante de compra</li>
              <li>No se aceptan devoluciones de productos personalizados o graduados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Garantía</h2>
            <p>
              Todos nuestros productos cuentan con garantía del fabricante contra defectos de fabricación. La garantía no cubre daños por
              uso inadecuado, negligencia o desgaste normal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contacto</h2>
            <p>Para consultas sobre estos términos, contáctenos en:</p>
            <ul className="list-none pl-0 space-y-2 mt-4">
              <li>
                <strong>Email:</strong> fullvision_optica@outlook.es
              </li>
              <li>
                <strong>Teléfono:</strong> +51 930639641
              </li>
              <li>
                <strong>Dirección:</strong> Av. Lima 1912 Prd. 10 1/2 Jose Galvez - V.M.T.
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
