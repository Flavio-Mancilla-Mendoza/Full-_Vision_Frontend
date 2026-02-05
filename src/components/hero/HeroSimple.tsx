import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useUser } from "@/hooks/useAuthCognito";
import { useHeroContent } from "@/hooks/useSiteContent";
import { useNavigate } from "react-router-dom";

// Contenido estático para fallback
const STATIC_HERO_CONTENT = {
  title: "Especialistas en Salud Visual",
  subtitle: "Descubre nuestra exclusiva colección de lentes diseñados para tu estilo y comodidad",
  alt: "Lentes de alta calidad - Full Vision",
};

const HeroSimple = memo(() => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { heroImage, heroTitle, heroSubtitle, heroImageAlt } = useHeroContent();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imagePreloaded, setImagePreloaded] = useState(false);

  // Usar contenido dinámico de la base de datos
  const finalHeroTitle = heroTitle || STATIC_HERO_CONTENT.title;
  const finalHeroSubtitle = heroSubtitle || STATIC_HERO_CONTENT.subtitle;
  const finalHeroImageAlt = heroImageAlt || STATIC_HERO_CONTENT.alt;

  // Precargar imagen crítica del hero antes de renderizar
  useEffect(() => {
    if (heroImage) {
      const img = new Image();
      img.src = heroImage;
      img.onload = () => {
        setImagePreloaded(true);
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImagePreloaded(true); // Mostrar fallback si hay error
      };
    }
  }, [heroImage]);

  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden">
      {/* Background con gradiente o imagen desde la base de datos */}
      <div className="absolute inset-0">
        {heroImage ? (
          <>
            {/* Skeleton/Placeholder mientras carga - Mejora visual */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60 animate-pulse" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </div>
            )}

            {/* Imagen real desde la base de datos - con mejor manejo de carga */}
            {imagePreloaded && (
              <div className="w-full h-full relative">
                <img
                  src={heroImage}
                  alt={finalHeroImageAlt}
                  className={`w-full h-full object-cover object-top transition-opacity duration-500 will-change-opacity ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  {...{ fetchpriority: "high" }}
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    contentVisibility: "auto",
                  }}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60" />
          </>
        ) : (
          // Gradiente por defecto si no hay imagen en la base de datos
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60" />
          </div>
        )}
      </div>

      {/* Contenido del hero */}
      <div className="relative container mx-auto px-4 lg:px-8 max-w-6xl h-full flex items-center">
        <div className="w-full lg:w-1/2 lg:ml-auto lg:pr-8">
          <div className="max-w-3xl lg:max-w-none text-white">
            <h1 className="text-3xl md:text-5xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight">{finalHeroTitle}</h1>
            <p className="text-base md:text-lg lg:text-lg mb-6 lg:mb-8 text-white/90 max-w-2xl lg:max-w-xl">{finalHeroSubtitle}</p>
            <div className="flex flex-wrap gap-3 lg:gap-4">
              <Button
                variant="accent"
                size="lg"
                className="hover-lift transition-transform duration-200 text-base lg:text-base px-6 lg:px-6 py-3 lg:py-3"
              >
                <ShoppingCart className="w-4 h-4 lg:w-4 lg:h-4 mr-2" />
                Explorar colección
              </Button>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white text-white hover:bg-white hover:text-primary backdrop-blur-sm transition-all duration-200 text-base lg:text-base px-6 lg:px-6 py-3 lg:py-3"
                  onClick={() => navigate("/citas")}
                >
                  <ArrowRight className="w-4 h-4 lg:w-4 lg:h-4 mr-2" />
                  Agendar examen
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSimple.displayName = "HeroSimple";

export default HeroSimple;
