// src/components/BestSellersCarousel.tsx
import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp } from "lucide-react";
import { getBestSellersForCarousel, getBestSellerBadge, getBestSellerBadgeColor, type BestSellerProduct } from "@/services/bestsellers";
import type { OpticalProduct } from "@/types";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { type CartItemWithProductLocal } from "@/services/cart";
import { ProductCard } from "@/components/products/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { convertBestSellerToProduct } from "@/lib/productConverters";

// Componente para el producto bestseller - recibe estado del carrito por props
const BestSellerProductCard = ({
  product,
  index,
  onAddToCart,
  isAddingToCart,
  addingProductId,
  cartItems,
}: {
  product: BestSellerProduct;
  index: number;
  onAddToCart: (product: BestSellerProduct) => void;
  isAddingToCart: boolean;
  addingProductId?: string;
  cartItems: CartItemWithProductLocal[];
}) => {
  const isInCart = cartItems.some((item) => item.id === product.id);
  const quantity = cartItems.find((item) => item.id === product.id)?.quantity || 0;

  return (
    <ProductCard
      id={product.id}
      name={product.name}
      image_url={product.image_url}
      image_alt={product.image_alt || product.name}
      base_price={product.base_price}
      sale_price={product.sale_price}
      discount_percentage={product.discount_percentage}
      brand_name={product.frame_style}
      onAddToCart={() => onAddToCart(product)}
      isAddingToCart={isAddingToCart && addingProductId === product.id}
      isInCart={isInCart}
      quantity={quantity}
      loading={index < 3 ? "eager" : "lazy"}
      index={index}
    />
  );
};

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

const BestSellersCarousel = () => {
  const [products, setProducts] = useState<BestSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook del carrito a nivel de carrusel (solo una suscripción)
  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();

  const handleAddToCart = (product: BestSellerProduct) => {
    const productForCart = convertBestSellerToProduct(product);
    addToCart({ productId: product.id, quantity: 1, product: productForCart });
  };

  useEffect(() => {
    async function loadBestSellers() {
      try {
        setLoading(true);

        const bestSellers = await getBestSellersForCarousel();
        // Best sellers loaded successfully

        // Image URL validation optimized for production
        bestSellers.forEach((product, index) => {
          // Product image validation completed silently

          // URL validation removed for performance in production
          if (product.image_url) {
            // URL validation optimized (no network calls in production)
            // fetch calls removed to improve performance
          }
        });

        setProducts(bestSellers);
      } catch (err) {
        console.error("Error loading best sellers:", err);
        setError("Error al cargar monturas más vendidas");
      } finally {
        setLoading(false);
      }
    }

    loadBestSellers();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-500 text-white text-sm px-4 py-1 flex items-center gap-2 mx-auto w-fit">
              <Trophy className="w-4 h-4" />
              MÁS VENDIDAS
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Top 10 Monturas Más Vendidas</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Las monturas favoritas de nuestros clientes</p>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <ProductSkeleton />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-500 text-white text-sm px-4 py-1 flex items-center gap-2 mx-auto w-fit">
              <Trophy className="w-4 h-4" />
              MÁS VENDIDAS
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Top 10 Monturas Más Vendidas</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Las monturas favoritas de nuestros clientes</p>
          </div>
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-500 text-white text-sm px-4 py-1 flex items-center gap-2 mx-auto w-fit">
              <Trophy className="w-4 h-4" />
              MÁS VENDIDAS
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Top 10 Monturas Más Vendidas</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Las monturas favoritas de nuestros clientes</p>
          </div>
          <div className="text-center text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay datos de ventas disponibles</p>
            <p className="text-sm mt-2">Vuelve más tarde para ver las monturas más vendidas</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-yellow-500 text-white text-sm px-4 py-1 flex items-center gap-2 mx-auto w-fit">
            <Trophy className="w-4 h-4" />
            MÁS VENDIDAS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Top 10 Monturas Más Vendidas</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Las monturas favoritas de nuestros clientes</p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {products.map((product, index) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <BestSellerProductCard
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

        {/* Nota informativa */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">* Ranking basado en datos de ventas y popularidad de productos</p>
        </div>
      </div>
    </section>
  );
};

export default BestSellersCarousel;
