import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star, Package } from "lucide-react";
import type { OpticalProduct } from "@/types";
import { generateOptimizedUrl } from "@/hooks/use-image-optimization";

interface ProductCardProps {
  product: OpticalProduct;
  isFeatured?: boolean;
  loading: boolean;
  handleToggleFeatured: (productId: string, featured: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isFeatured = false, loading, handleToggleFeatured }) => {
  const [imageError, setImageError] = useState(false);
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const primaryImage = product.product_images?.filter((img) => img.is_primary)?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];

  const handleImageError = () => {
    setImageError(true);
  };

  const refreshImage = () => {
    setImageError(false);
    setImageKey((prev) => prev + 1);
  };

  const toggleImageDetails = () => {
    setShowImageDetails(!showImageDetails);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Imagen del producto */}
          <div
            className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative group cursor-pointer"
            onClick={toggleImageDetails}
          >
            {primaryImage && !imageError ? (
              <img
                key={imageKey}
                src={generateOptimizedUrl(primaryImage.url)}
                alt={primaryImage.alt_text || product.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 relative">
                <Package className="w-8 h-8" />
                {!primaryImage && <span className="text-xs mt-1 text-center">Sin imagen</span>}
                {imageError && (
                  <div className="text-center">
                    <span className="text-xs mt-1 block text-red-500">Error de imagen</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 px-2 text-xs mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshImage();
                      }}
                    >
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>
            )}
            {/* Indicador de detalles */}
            <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm leading-tight truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                    {product.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  {product.is_bestseller && (
                    <Badge variant="outline" className="text-xs">
                      Bestseller
                    </Badge>
                  )}
                </div>
                <p className="text-primary font-semibold mt-2">S/ {product.base_price.toFixed(2)}</p>
              </div>

              {/* Switch para destacado */}
              <div className="flex items-center gap-2 ml-4">
                <Switch checked={isFeatured} onCheckedChange={(checked) => handleToggleFeatured(product.id, checked)} disabled={loading} />
                {isFeatured ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : <Star className="w-4 h-4 text-gray-300" />}
              </div>
            </div>

            {/* Detalles de imagen (expandible) */}
            {showImageDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Detalles de Imagen:</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={async () => {
                      if (primaryImage) {
                        try {
                          const response = await fetch(primaryImage.url, { method: "HEAD" });
                          alert(
                            `URL: ${primaryImage.url}\nEstado: ${response.status} ${response.statusText}\nTipo: ${
                              response.headers.get("content-type") || "Desconocido"
                            }`
                          );
                        } catch (error) {
                          alert("No se pudo obtener detalles de la imagen");
                        }
                      }
                    }}
                  >
                    Ver detalles
                  </Button>
                </div>
                <div>
                  <span className="block">URL: {primaryImage?.url || "Sin imagen"}</span>
                  <span className="block">Alt: {primaryImage?.alt_text || "-"}</span>
                  <span className="block">Orden: {primaryImage?.sort_order ?? "-"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
