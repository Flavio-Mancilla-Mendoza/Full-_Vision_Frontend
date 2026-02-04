import { useEffect, useState } from "react";

interface SplashScreenProps {
  onLoadComplete: () => void;
  minDisplayTime?: number; // Tiempo mínimo para mostrar el splash (ms)
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadComplete, minDisplayTime = 800 }) => {
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    // Esperar a que el DOM esté listo y el tiempo mínimo haya pasado
    const timer = setTimeout(() => {
      setShouldHide(true);
      // Pequeño delay para la animación de fade-out
      setTimeout(() => {
        onLoadComplete();
      }, 300);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [onLoadComplete, minDisplayTime]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-white transition-opacity duration-300 ${
        shouldHide ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center">
        {/* Logo con animación suave */}
        <div className="mb-8 animate-pulse">
          <div className="relative">
            {/* Círculo de fondo con animación */}
            <div className="absolute inset-0 -m-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-xl animate-pulse"></div>
            <img src="/logo4.ico" alt="Full Vision" className="relative w-28 h-28 mx-auto drop-shadow-lg" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-8 opacity-0 animate-[fadeIn_1s_ease-in_0.2s_forwards]">
          Especialistas en Salud Visual
        </p>

        {/* Spinner de carga elegante */}
        <div className="flex justify-center items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>

      {/* Agregar animación fadeIn al CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
