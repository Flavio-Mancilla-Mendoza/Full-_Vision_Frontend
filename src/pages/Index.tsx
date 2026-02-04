import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/common/SEO";
import { useUser } from "@/hooks/useAuthCognito";

// Hero simple - carga inmediata para LCP
import HeroSimple from "@/components/hero/HeroSimple";

// FeaturedProducts crítico - carga inmediata también
import FeaturedProducts from "@/components/products/FeaturedProducts";

// Modal de promoción - carga inmediata
import PromoModal from "@/components/promo/PromoModal";

// Solo lazy load para componentes menos críticos
const SaleCarousel = lazy(() => import("@/components/carousels/SaleCarousel"));
const BestSellersCarousel = lazy(() => import("@/components/carousels/BestSellersCarousel"));
const CustomerCarousel = lazy(() => import("@/components/carousels/CustomerCarousel"));

// Componente de loading optimizado
const ComponentSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div className={`w-full ${height} animate-pulse bg-gray-200 rounded-lg`} />
);

const Index = () => {
  const { isAuthenticated } = useUser();

  return (
    <>
      <SEO
        title="Full Vision - Lentes de calidad premium"
        description="Descubre nuestra exclusiva colección de lentes diseñados para tu estilo y comodidad. Calidad premium, diseños modernos y atención personalizada."
        keywords="lentes, gafas, óptica, examen de vista, lentes de sol, filtro luz azul"
        type="website"
        url={window.location.href}
      />

      {/* Modal de promoción */}
      <PromoModal />

      <main>
        {/* Hero simple - carga inmediata para mejorar LCP */}
        <HeroSimple />

        {/* Productos destacados - carga inmediata para above-the-fold */}
        <FeaturedProducts />

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
