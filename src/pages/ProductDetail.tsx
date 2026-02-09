/**
 * ProductDetailPage - Página de detalle de producto
 * Muestra imagen, nombre, marca, precio, SKU y promociones
 */

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  ChevronRight,
  Check,
  ShoppingCart,
  Store,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useProductDetail } from "@/hooks/useProductDetail";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { transformProductForCart } from "@/lib/product-utils";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/ui/optimized-image";
import SEO from "@/components/common/SEO";
import type { OpticalProduct } from "@/types";

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useProductDetail(slug);

  const { addToCart, isAddingToCart, addingProductId, cartItems } =
    useOptimizedAuthCart();

  // Loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          {error instanceof Error
            ? error.message
            : "El producto que buscas no existe o ya no está disponible."}
        </p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  // Calcular precios
  let finalPrice = product.base_price;
  if (product.sale_price && product.sale_price > 0) {
    finalPrice = product.sale_price;
  } else if (
    product.discount_percentage &&
    product.discount_percentage > 0
  ) {
    finalPrice =
      product.base_price * (1 - product.discount_percentage / 100);
  }

  const hasDiscount = Boolean(
    (product.sale_price &&
      product.sale_price > 0 &&
      product.sale_price < product.base_price) ||
      (product.discount_percentage && product.discount_percentage > 0)
  );

  const discountPercentage =
    product.sale_price &&
    product.sale_price > 0 &&
    product.sale_price < product.base_price
      ? Math.round(
          ((product.base_price - product.sale_price) / product.base_price) *
            100
        )
      : product.discount_percentage && product.discount_percentage > 0
      ? product.discount_percentage
      : 0;

  // Imágenes
  const images =
    product.product_images && product.product_images.length > 0
      ? product.product_images.sort((a, b) => a.sort_order - b.sort_order)
      : [{ id: "main", url: product.image_url || "", alt_text: product.name, is_primary: true, sort_order: 0, s3_key: "" }];

  const currentImage = images[selectedImageIndex];

  // Carrito
  const isInCart = cartItems.some(
    (item) => item.product_id === product.id
  );
  const cartQuantity =
    cartItems.find((item) => item.product_id === product.id)?.quantity || 0;

  const handleAddToCart = () => {
    const opticalProduct = transformProductForCart(product as unknown as OpticalProduct);
    addToCart({
      productId: product.id,
      quantity: 1,
      product: opticalProduct as unknown as Parameters<typeof addToCart>[0]["product"],
    });
  };

  // Determinar breadcrumb según género
  const genderLabel =
    product.gender === "hombre"
      ? "Lentes para Hombre"
      : product.gender === "mujer"
      ? "Lentes para Mujer"
      : product.gender === "niños"
      ? "Lentes para Niños"
      : "Productos";

  const genderPath =
    product.gender === "hombre"
      ? "/hombres"
      : product.gender === "mujer"
      ? "/mujer"
      : product.gender === "niños"
      ? "/ninos"
      : "/";

  // Lens type label
  const lensTypeLabel = product.lens_type
    ? `LENTE DE ${product.lens_type.toUpperCase()}`
    : "LENTE";

  const productTitle = `${lensTypeLabel} ${product.brand?.name ? product.brand.name.toUpperCase() : ""} ${product.name}`.trim();

  return (
    <>
      <SEO
        title={`${product.name} | Full Vision`}
        description={
          product.description || `${productTitle} - Compra en Full Vision`
        }
        keywords={`${product.brand?.name || ""}, ${product.lens_type || ""}, lentes, gafas`}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
          <button
            onClick={() => navigate("/")}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Inicio
          </button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <button
            onClick={() => navigate(genderPath)}
            className="hover:text-foreground transition-colors"
          >
            {genderLabel}
          </button>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-semibold truncate max-w-md">
            {productTitle}
          </span>
        </nav>

        {/* Main content: image + info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Image gallery */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative bg-white rounded-lg overflow-hidden aspect-square flex items-center justify-center border">
              <ProductImage
                src={currentImage.url || "/placeholder-glasses.jpg"}
                alt={currentImage.alt_text || product.name}
                width={600}
                height={600}
                className="w-full h-full object-contain p-8"
                priority={true}
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={90}
              />

              {/* Navigation arrows for multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((i) =>
                        i === 0 ? images.length - 1 : i - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((i) =>
                        i === images.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex
                        ? "border-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <img
                      src={img.url || "/placeholder-glasses.jpg"}
                      alt={img.alt_text || `Vista ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight uppercase">
                {productTitle}
              </h1>
              {product.brand?.name && (
                <p className="text-muted-foreground mt-2">
                  Marca{" "}
                  <span className="font-semibold text-foreground">
                    {product.brand.name.toUpperCase()}
                  </span>
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <div className="flex items-center gap-4">
                <span className="text-3xl lg:text-4xl font-bold">
                  {formatCurrency(finalPrice)}
                </span>
                {hasDiscount && discountPercentage > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-sm px-3 py-1">
                    {Math.round(discountPercentage)}% OFF
                  </Badge>
                )}
              </div>
              {hasDiscount && (
                <p className="text-lg text-muted-foreground line-through mt-1">
                  {formatCurrency(product.base_price)}
                </p>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">SKU</span> {product.sku}
              </p>
            )}

            <Separator />

            {/* Promotions */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                Promociones Activas
              </h3>
              <Card className="border-primary/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <Store className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-primary font-medium">
                    Recoge en tienda mañana
                  </span>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Product specs */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.frame_material && (
                <div>
                  <span className="text-muted-foreground">Material</span>
                  <p className="font-medium capitalize">
                    {product.frame_material}
                  </p>
                </div>
              )}
              {product.frame_style && (
                <div>
                  <span className="text-muted-foreground">Estilo</span>
                  <p className="font-medium capitalize">
                    {product.frame_style}
                  </p>
                </div>
              )}
              {product.frame_size && (
                <div>
                  <span className="text-muted-foreground">Talla</span>
                  <p className="font-medium uppercase">{product.frame_size}</p>
                </div>
              )}
              {product.frame_color && (
                <div>
                  <span className="text-muted-foreground">Color</span>
                  <p className="font-medium capitalize">
                    {product.frame_color}
                  </p>
                </div>
              )}
              {product.lens_color && (
                <div>
                  <span className="text-muted-foreground">Color lente</span>
                  <p className="font-medium capitalize">
                    {product.lens_color}
                  </p>
                </div>
              )}
              {product.bridge_width && (
                <div>
                  <span className="text-muted-foreground">Puente</span>
                  <p className="font-medium">{product.bridge_width}mm</p>
                </div>
              )}
              {product.temple_length && (
                <div>
                  <span className="text-muted-foreground">Patilla</span>
                  <p className="font-medium">{product.temple_length}mm</p>
                </div>
              )}
              {product.lens_width && (
                <div>
                  <span className="text-muted-foreground">Lente</span>
                  <p className="font-medium">{product.lens_width}mm</p>
                </div>
              )}
            </div>

            {/* Features badges */}
            <div className="flex flex-wrap gap-2">
              {product.has_uv_protection && (
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" /> Protección UV
                </Badge>
              )}
              {product.has_blue_filter && (
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" /> Filtro Azul
                </Badge>
              )}
              {product.is_photochromic && (
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" /> Fotocromático
                </Badge>
              )}
              {product.has_anti_reflective && (
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" /> Antirreflejo
                </Badge>
              )}
            </div>

            <Separator />

            {/* Add to cart */}
            <Button
              size="lg"
              className="w-full text-base py-6"
              variant={isInCart ? "outline" : "default"}
              onClick={handleAddToCart}
              disabled={isAddingToCart && addingProductId === product.id}
            >
              {isAddingToCart && addingProductId === product.id ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                  Agregando...
                </>
              ) : isInCart ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  En carrito ({cartQuantity})
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Agregar al carrito
                </>
              )}
            </Button>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide mb-2">
                  Descripción
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
