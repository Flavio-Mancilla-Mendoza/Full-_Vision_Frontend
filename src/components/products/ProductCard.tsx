import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag } from "lucide-react";
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
  stock_quantity?: number | null;
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
  stock_quantity,
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

  const isOutOfStock = stock_quantity !== undefined && stock_quantity !== null && stock_quantity <= 0;
  const productImage = image_url || "/placeholder-glasses.jpg";

  // Normalizar y formatear tipo de lente
  const LENS_TYPE_LABELS: Record<string, string> = {
    sol: "Sol",
    solar: "Sol",
    "lente solar": "Sol",
    graduado: "Graduado",
    "fotocromático": "Fotocromático",
    fotocromático: "Fotocromático",
    "filtro-azul": "Filtro Azul",
    "filtro azul": "Filtro Azul",
    lectura: "Lectura",
    contacto: "Contacto",
  };

  const lensLabel = lens_type
    ? LENS_TYPE_LABELS[lens_type.toLowerCase().trim()] || lens_type.charAt(0).toUpperCase() + lens_type.slice(1).toLowerCase()
    : null;

  const handleCardClick = () => {
    if (slug) {
      navigate(`/producto/${slug}`);
    }
  };

  return (
    <Card
      className={`border-border/50 overflow-hidden group hover:shadow-[var(--shadow-card)] transition-all duration-300 ${slug ? "cursor-pointer" : ""}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Imagen */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white aspect-[4/3]">
          <ProductImage
            src={productImage}
            alt={image_alt || name}
            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
            priority={loading === "eager"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={85}
            placeholder="blur"
          />

          {/* Badges superiores */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start">
            {/* Tipo de lente */}
            {lensLabel && (
              <span className="text-[10px] font-medium tracking-wider uppercase text-primary/60 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {lensLabel}
              </span>
            )}

            {/* Descuento */}
            {hasDiscount && discountPct > 0 && (
              <Badge className="bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ml-auto">
                -{Math.round(discountPct)}%
              </Badge>
            )}
          </div>

          {/* Badge sin stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
                Agotado
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pt-3 pb-4 space-y-2.5">
          {/* Marca — color accent (teal) */}
          {brand_name && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
              {brand_name}
            </p>
          )}

          {/* Precios */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground/70 line-through">
                {formatCurrency(base_price)}
              </span>
            )}
          </div>

          {/* Botón */}
          <Button
            className="w-full gap-2 text-xs font-medium"
            variant={isInCart ? "outline" : "default"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={isAddingToCart || isOutOfStock}
          >
            {isOutOfStock ? (
              "Sin stock"
            ) : isAddingToCart ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Agregando...
              </>
            ) : isInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                En carrito ({quantity})
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Agregar al carrito
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);
