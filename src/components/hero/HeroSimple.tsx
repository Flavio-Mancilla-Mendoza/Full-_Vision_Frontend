import { memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { useHeroContent } from "@/hooks/useSiteContent";
import { useNavigate } from "react-router-dom";

// URL estática del hero image en CloudFront - se precarga en index.html
const STATIC_HERO_IMAGE = "https://dmnfd6b4vz00z.cloudfront.net/assets/heroimage-compressed.jpg";

// Contenido estático para fallback
const STATIC_HERO_CONTENT = {
  title: "Especialistas en Salud Visual",
  subtitle: "Descubre nuestra exclusiva colección de lentes diseñados para tu estilo y comodidad",
  alt: "Lentes de alta calidad - Full Vision",
};

const HeroSimple = memo(() => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { heroImage, heroTitle, heroSubtitle, heroImageAlt } = useHeroContent();

  // Usar contenido dinámico de la base de datos
  const finalHeroTitle = heroTitle || STATIC_HERO_CONTENT.title;
  const finalHeroSubtitle = heroSubtitle || STATIC_HERO_CONTENT.subtitle;
  const finalHeroImageAlt = heroImageAlt || STATIC_HERO_CONTENT.alt;

  // Cache hero image URL for instant render on repeat visits
  useEffect(() => {
    if (heroImage) {
      try { localStorage.setItem('hero_image_url', heroImage); } catch { /* localStorage not available */ }
    }
  }, [heroImage]);

  // Prioridad: 1) imagen de la API, 2) cache en localStorage, 3) imagen estática en CloudFront
  const displayImage = heroImage || (() => {
    try { return localStorage.getItem('hero_image_url') || STATIC_HERO_IMAGE; } catch { return STATIC_HERO_IMAGE; }
  })();

  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[650px] overflow-hidden">
      {/* Background con gradiente o imagen desde la base de datos */}
      <div className="absolute inset-0">
        {displayImage ? (
          <>
            {/* Imagen hero - render inmediato para LCP óptimo */}
            <div className="w-full h-full relative">
              <img
                src={displayImage}
                alt={finalHeroImageAlt}
                className="w-full h-full object-cover object-top"
                loading="eager"
                {...{ fetchpriority: "high" }}
                decoding="async"
                sizes="100vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60" />
          </>
        ) : (
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
