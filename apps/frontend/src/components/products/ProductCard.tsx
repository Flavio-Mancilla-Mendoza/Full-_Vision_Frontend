import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { memo } from "react";
import { ProductImage } from "@/components/ui/optimized-image";

interface ProductCardProps {
  id: string;
  name: string;
  image_url: string | null;
  image_alt?: string | null;
  base_price: number;
  sale_price?: number | null;
  discount_percentage?: number | null;
  brand_name?: string | null;
  onAddToCart: () => void;
  isAddingToCart?: boolean;
  isInCart?: boolean;
  quantity?: number;
  loading?: "eager" | "lazy";
  index?: number;
}

const ProductCardComponent = ({
  id,
  name,
  image_url,
  image_alt,
  base_price,
  sale_price,
  discount_percentage,
  onAddToCart,
  isAddingToCart = false,
  isInCart = false,
  quantity = 0,
  loading = "lazy",
  index = 0,
}: ProductCardProps) => {
  // Calcular precio final
  let finalPrice = base_price;
  if (sale_price && sale_price > 0) {
    finalPrice = sale_price;
  } else if (discount_percentage && discount_percentage > 0) {
    finalPrice = base_price * (1 - discount_percentage / 100);
  }

  const hasDiscount = (sale_price && sale_price > 0 && sale_price < base_price) || (discount_percentage && discount_percentage > 0);

  // Calcular porcentaje de descuento solo si hay descuento real
  const discountPercentage =
    sale_price && sale_price > 0 && sale_price < base_price
      ? Math.round(((base_price - sale_price) / base_price) * 100)
      : discount_percentage && discount_percentage > 0
      ? discount_percentage
      : 0;

  // Imagen con fallback
  const productImage = image_url || "/placeholder-glasses.jpg";

  return (
    <div className="p-2">
      <Card className="hover-lift border-border overflow-hidden group">
        <CardContent className="p-0">
          {/* Imagen */}
          <div className="relative overflow-hidden bg-secondary">
            <ProductImage
              src={productImage}
              alt={image_alt || name}
              width={400}
              height={224}
              className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
              priority={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={85}
              placeholder="blur"
            />

            {/* Badge de descuento */}
            {hasDiscount && discountPercentage > 0 && (
              <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                {Math.round(discountPercentage)}% OFF
              </Badge>
            )}
          </div>

          <div className="p-4">
            {/* Nombre del producto */}
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{name}</h3>

            {/* Precios */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold text-primary">{formatCurrency(finalPrice)}</span>
              {hasDiscount && <span className="text-sm text-muted-foreground line-through">{formatCurrency(base_price)}</span>}
            </div>

            {/* Botón */}
            <Button className="w-full" variant={isInCart ? "outline" : "accent"} onClick={onAddToCart} disabled={isAddingToCart}>
              {isAddingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Agregando...
                </>
              ) : isInCart ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  En carrito ({quantity})
                </>
              ) : (
                "Agregar al carrito"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Memorizar componente para evitar re-renders innecesarios
export const ProductCard = memo(ProductCardComponent);
