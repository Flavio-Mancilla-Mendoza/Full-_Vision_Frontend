import FeaturedProductsCarousel from "@/components/carousels/FeaturedProductsCarousel";

const FeaturedProducts = () => {
  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">Lentes Destacados</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base lg:text-lg">Productos seleccionados especialmente para ti</p>
        </div>

        <div className="w-full flex justify-center">
          <FeaturedProductsCarousel />
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
