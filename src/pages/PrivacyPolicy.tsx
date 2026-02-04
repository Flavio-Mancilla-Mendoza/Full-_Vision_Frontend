import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center">Política de Privacidad</CardTitle>
          <p className="text-center text-muted-foreground mt-2">Última actualización: 23 de diciembre de 2025</p>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base max-w-none">
          <Separator className="my-6" />

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
            <p>Recopilamos la siguiente información cuando utiliza nuestros servicios:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Información personal:</strong> Nombre, email, teléfono, dirección, DNI
              </li>
              <li>
                <strong>Información de pedidos:</strong> Historial de compras, preferencias
              </li>
              <li>
                <strong>Información técnica:</strong> Dirección IP, tipo de navegador, cookies
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Uso de la Información</h2>
            <p>Utilizamos su información para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Procesar sus pedidos y entregas</li>
              <li>Gestionar citas para exámenes visuales</li>
              <li>Enviar comunicaciones sobre pedidos y promociones</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Protección de Datos</h2>
            <p>
              Implementamos medidas de seguridad para proteger su información personal contra acceso no autorizado, alteración, divulgación
              o destrucción. Utilizamos encriptación SSL y almacenamiento seguro en servidores protegidos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Compartir Información</h2>
            <p>No vendemos su información personal. Podemos compartirla únicamente con:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proveedores de servicios de pago y envío</li>
              <li>Autoridades cuando sea requerido por ley</li>
              <li>Proveedores de servicios que nos ayudan a operar el negocio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
            <p>
              Utilizamos cookies para mejorar su experiencia de navegación, recordar preferencias y analizar el tráfico del sitio. Puede
              configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del sitio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Sus Derechos</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a su información personal</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Solicitar la portabilidad de sus datos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Cambios en la Política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios significativos mediante email o aviso en el
              sitio web.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contacto</h2>
            <p>Para consultas sobre privacidad, contáctenos en:</p>
            <ul className="list-none pl-0 space-y-2 mt-4">
              <li>
                <strong>Email:</strong> privacidad@fullvision.pe
              </li>
              <li>
                <strong>Teléfono:</strong> +51 999 999 999
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
