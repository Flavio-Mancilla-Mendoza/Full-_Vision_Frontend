import { lazy, Suspense } from "react";
import SEO from "@/components/common/SEO";

// Hero simple - carga inmediata para LCP
import HeroSimple from "@/components/hero/HeroSimple";

// Todo lo demás es lazy - FeaturedProducts está below the fold, PromoModal es decorativo
const FeaturedProducts = lazy(() => import("@/components/products/FeaturedProducts"));
const PromoModal = lazy(() => import("@/components/promo/PromoModal"));
const SaleCarousel = lazy(() => import("@/components/carousels/SaleCarousel"));
const BestSellersCarousel = lazy(() => import("@/components/carousels/BestSellersCarousel"));
const CustomerCarousel = lazy(() => import("@/components/carousels/CustomerCarousel"));

// Skeleton con altura reservada para evitar CLS
const FeaturedSkeleton = () => (
  <div className="w-full py-12 lg:py-20 bg-background">
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="text-center mb-8 lg:mb-16">
        <div className="h-9 w-64 mx-auto bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-96 mx-auto mt-4 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const ComponentSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div className={`w-full ${height} animate-pulse bg-gray-200 rounded-lg`} />
);

const Index = () => {
  return (
    <>
      <SEO
        title="Full Vision - Lentes de calidad premium"
        description="Descubre nuestra exclusiva colección de lentes diseñados para tu estilo y comodidad. Calidad premium, diseños modernos y atención personalizada."
        keywords="lentes, gafas, óptica, examen de vista, lentes de sol, filtro luz azul"
        type="website"
        url={window.location.href}
      />

      {/* Modal de promoción - lazy, no bloquea LCP ni causa CLS */}
      <Suspense fallback={null}>
        <PromoModal />
      </Suspense>

      <main>
        {/* Hero simple - carga inmediata para mejorar LCP */}
        <HeroSimple />

        {/* Productos destacados - below the fold, lazy con skeleton que reserva espacio */}
        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedProducts />
        </Suspense>

        {/* Carrusel de más vendidos */}
        <Suspense fallback={<ComponentSkeleton />}>
          <BestSellersCarousel />
        </Suspense>

        {/* Carouseles - carga con menor prioridad */}
        <Suspense fallback={<ComponentSkeleton />}>
          <SaleCarousel />
        </Suspense>

        {/* Mostrar carrusel de testimonios siempre */}
        <Suspense fallback={<ComponentSkeleton />}>
          <CustomerCarousel />
        </Suspense>
      </main>
    </>
  );
};

export default Index;
