// src/components/FeaturedProductsCarousel.tsx
import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Sparkles } from "lucide-react";
import { getFeaturedProductsForHome, type FeaturedProduct } from "@/services/featured";
import type { OpticalProduct } from "@/types";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { type CartItemWithProductLocal } from "@/services/cart";
import { ProductCard } from "@/components/products/ProductCard";
import { convertFeaturedToProduct } from "@/lib/productConverters";

const ProductSkeleton = () => (
  <div className="p-2">
    <Card className="hover-lift border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="relative overflow-hidden bg-secondary">
          <Skeleton className="w-full h-56" />
          <Badge className="absolute top-3 right-3">
            <Skeleton className="w-16 h-4" />
          </Badge>
        </div>
        <div className="p-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

// Componente para cada producto individual - recibe estado del carrito por props
const FeaturedProductCard = ({
  product,
  index,
  onAddToCart,
  isAddingToCart,
  addingProductId,
  cartItems,
}: {
  product: FeaturedProduct;
  index: number;
  onAddToCart: (product: FeaturedProduct) => void;
  isAddingToCart: boolean;
  addingProductId?: string;
  cartItems: CartItemWithProductLocal[];
}) => {
  const isInCart = cartItems.some((item) => item.product_id === product.id);
  const quantity = cartItems.find((item) => item.product_id === product.id)?.quantity || 0;

  return (
    <ProductCard
      id={product.id}
      name={product.name}
      slug={product.slug}
      image_url={product.image_url}
      image_alt={product.image_alt}
      base_price={product.base_price}
      sale_price={product.sale_price}
      discount_percentage={product.discount_percentage}
      brand_name={product.brand?.name || product.brand_name}
      lens_type={product.lens_type}
      onAddToCart={() => onAddToCart(product)}
      isAddingToCart={isAddingToCart && addingProductId === product.id}
      isInCart={isInCart}
      quantity={quantity}
      loading={index < 2 ? "eager" : "lazy"}
      index={index}
    />
  );
};

const FeaturedProductsCarousel = () => {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook del carrito a nivel de carrusel (solo una suscripción)
  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();

  const handleAddToCart = (product: FeaturedProduct) => {
    const productForCart = convertFeaturedToProduct(product);
    addToCart({ productId: product.id, quantity: 1, product: productForCart });
  };

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        setLoading(true);
        const featuredProducts = await getFeaturedProductsForHome();
        setProducts(featuredProducts);
      } catch (err) {
        console.error("Error loading featured products:", err);
        setError("Error al cargar productos destacados");
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {Array.from({ length: 4 }).map((_, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <ProductSkeleton />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        <Package className="w-12 h-12 mx-auto mb-4 text-red-300" />
        <p>{error}</p>
        <p className="text-sm mt-2">Intenta recargar la página</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No hay productos destacados disponibles</p>
        <p className="text-sm mt-2">Los productos destacados aparecerán aquí cuando sean configurados</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product, index) => (
            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
              <FeaturedProductCard
                product={product}
                index={index}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
                addingProductId={addingProductId}
                cartItems={cartItems}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

export default FeaturedProductsCarousel;
