import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { calculateFinalPrice, hasProductDiscount, calculateDiscountPercentage } from "@/lib/product-utils";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ProductImage } from "@/components/ui/optimized-image";

interface ProductCardProps {
  id: string;
  name: string;
  slug?: string | null;
  image_url: string | null;
  image_alt?: string | null;
  base_price: number;
  sale_price?: number | null;
  discount_percentage?: number | null;
  brand_name?: string | null;
  lens_type?: string | null;
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
  slug,
  image_url,
  image_alt,
  base_price,
  sale_price,
  discount_percentage,
  brand_name,
  lens_type,
  onAddToCart,
  isAddingToCart = false,
  isInCart = false,
  quantity = 0,
  loading = "lazy",
  index = 0,
}: ProductCardProps) => {
  const navigate = useNavigate();

  // Precios (lógica centralizada)
  const finalPrice = calculateFinalPrice({ base_price, sale_price, discount_percentage });
  const hasDiscount = hasProductDiscount({ base_price, sale_price, discount_percentage });
  const discountPct = calculateDiscountPercentage({ base_price, sale_price, discount_percentage: discount_percentage ?? undefined });

  const productImage = image_url || "/placeholder-glasses.jpg";

  // Tipo de lente formateado
  const lensLabel = lens_type
    ? `Lentes de ${lens_type.charAt(0).toUpperCase() + lens_type.slice(1).toLowerCase()}`
    : "Lentes";

  const handleCardClick = () => {
    if (slug) {
      navigate(`/producto/${slug}`);
    }
  };

  return (
    <Card className={`border-border overflow-hidden group hover:shadow-lg transition-shadow duration-300 ${slug ? "cursor-pointer" : ""}`} onClick={handleCardClick}>
      <CardContent className="p-0">
        {/* Imagen */}
        <div className="relative overflow-hidden bg-white">
          <ProductImage
            src={productImage}
            alt={image_alt || name}
            width={400}
            height={280}
            className="w-full aspect-[4/3] object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            priority={loading === "eager"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={85}
            placeholder="blur"
          />

          {/* Badge de descuento */}
          {hasDiscount && discountPct > 0 && (
            <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5">
              {Math.round(discountPct)}% OFF
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-1.5">
          {/* Marca (arriba, destacada) */}
          {brand_name && (
            <h3 className="font-bold text-sm uppercase leading-tight">{brand_name}</h3>
          )}

          {/* Categoría del lente */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{lensLabel}</p>

          {/* Precios */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-base font-bold text-foreground">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(base_price)}
              </span>
            )}
          </div>

          {/* Botón */}
          <div className="pt-3">
            <Button
              className="w-full"
              variant={isInCart ? "outline" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Agregando...
                </>
              ) : isInCart ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  En carrito ({quantity})
                </>
              ) : (
                "Agregar al carrito"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);
