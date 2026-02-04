import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Página no encontrada - Full Vision"
        description="La página que buscas no existe. Regresa a nuestra página principal para explorar nuestros productos."
        type="website"
        url={window.location.href}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center space-y-6 px-4">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700">Página no encontrada</h2>
            <p className="text-gray-600 max-w-md mx-auto">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
          </div>

          <div className="space-y-4">
            <Link to="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Volver al inicio
              </Button>
            </Link>

            <div className="text-sm text-gray-500">¿Necesitas ayuda? Contacta nuestro servicio al cliente</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
