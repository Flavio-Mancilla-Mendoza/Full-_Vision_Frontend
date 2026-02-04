import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/ProductCard";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import type { OpticalProduct } from "@/types";
import { getLiquidacionProducts, LiquidacionProduct, calculateFinalPrice, calculateDiscountPercentage } from "@/services/liquidacion";
import { convertLiquidacionToProduct } from "@/lib/productConverters";

const SaleCarousel = () => {
  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();
  const [saleItems, setSaleItems] = useState<LiquidacionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSaleItems = async () => {
      setIsLoading(true);
      try {
        const products = await getLiquidacionProducts(10);
        setSaleItems(products);
      } catch (error) {
        console.error("Error fetching liquidacion products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaleItems();
  }, []);

  const handleAddToCart = (item: LiquidacionProduct) => {
    const productForCart = convertLiquidacionToProduct(item);
    addToCart({ productId: item.id, quantity: 1, product: productForCart });
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-destructive text-destructive-foreground text-sm px-4 py-1">LIQUIDACIÓN</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Monturas en liquidación</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Cargando productos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (saleItems.length === 0) {
    return null; // No mostrar el carrusel si no hay productos en liquidación
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-destructive text-destructive-foreground text-sm px-4 py-1">LIQUIDACIÓN</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Monturas en liquidación</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Aprovecha descuentos increíbles en monturas seleccionadas</p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {saleItems.map((item, index) => {
              const finalPrice = calculateFinalPrice(item);
              const discountPercentage = calculateDiscountPercentage(item);

              return (
                <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                  <ProductCard
                    id={item.id}
                    name={item.name}
                    image_url={item.image_url || ""}
                    image_alt={item.product_images?.[0]?.alt_text || item.name}
                    base_price={item.base_price}
                    sale_price={finalPrice}
                    discount_percentage={discountPercentage}
                    onAddToCart={() => handleAddToCart(item)}
                    isAddingToCart={isAddingToCart && addingProductId === item.id}
                    isInCart={cartItems.some((cartItem) => cartItem.id === item.id)}
                    quantity={cartItems.find((cartItem) => cartItem.id === item.id)?.quantity || 0}
                    loading={index < 3 ? "eager" : "lazy"}
                    index={index}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default SaleCarousel;
