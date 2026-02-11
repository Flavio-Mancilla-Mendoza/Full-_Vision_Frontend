/**
 * ProductDetailPage - Página de detalle de producto
 * Muestra imagen, nombre, marca, precio, SKU y promociones
 */

import React from "react";
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
} from "lucide-react";
import { useProductDetail } from "@/hooks/useProductDetail";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import {
  transformProductForCart,
  calculateFinalPrice,
  hasProductDiscount,
  calculateDiscountPercentage,
  getSortedProductImages,
  buildProductTitle,
  GENDER_LABELS,
  GENDER_PATHS,
} from "@/lib/product-utils";
import { formatCurrency } from "@/lib/utils";
import SEO from "@/components/common/SEO";
import { ImageGallery, ProductSpecs, ProductFeatures } from "@/components/products/product-detail";

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

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

  // Precios (lógica centralizada)
  const finalPrice = calculateFinalPrice(product);
  const hasDiscount = hasProductDiscount(product);
  const discountPct = calculateDiscountPercentage(product);

  // Imágenes ordenadas
  const images = getSortedProductImages(product);

  // Carrito
  const isInCart = cartItems.some((item) => item.product_id === product.id);
  const cartQuantity =
    cartItems.find((item) => item.product_id === product.id)?.quantity || 0;

  const handleAddToCart = () => {
    const cartProduct = transformProductForCart(product);
    addToCart({
      productId: product.id,
      quantity: 1,
      product: cartProduct as Parameters<typeof addToCart>[0]["product"],
    });
  };

  // Breadcrumb
  const genderLabel = (product.gender && GENDER_LABELS[product.gender]) || "Productos";
  const genderPath = (product.gender && GENDER_PATHS[product.gender]) || "/";

  const productTitle = buildProductTitle(product);

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
          <ImageGallery images={images} productName={product.name} />

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
                {hasDiscount && discountPct > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-sm px-3 py-1">
                    {Math.round(discountPct)}% OFF
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
            <ProductSpecs
              frame_material={product.frame_material}
              frame_style={product.frame_style}
              frame_size={product.frame_size}
              frame_color={product.frame_color}
              lens_color={product.lens_color}
              bridge_width={product.bridge_width}
              temple_length={product.temple_length}
              lens_width={product.lens_width}
            />

            {/* Features badges */}
            <ProductFeatures
              has_uv_protection={product.has_uv_protection}
              has_blue_filter={product.has_blue_filter}
              is_photochromic={product.is_photochromic}
              has_anti_reflective={product.has_anti_reflective}
            />

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
