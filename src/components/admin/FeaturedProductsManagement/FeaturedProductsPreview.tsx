import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { OpticalProduct } from "@/types";
import { generateOptimizedUrl } from "@/hooks/use-image-optimization";

interface FeaturedProductsPreviewProps {
  featuredProducts: OpticalProduct[];
}

export const FeaturedProductsPreview: React.FC<FeaturedProductsPreviewProps> = ({ featuredProducts }) => (
  <Card>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {featuredProducts.slice(0, 4).map((product) => {
          const primaryImage = product.product_images?.filter((img) => img.is_primary)?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];

          return (
            <div key={product.id} className="bg-secondary/30 rounded-lg p-3">
              <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                {primaryImage ? (
                  <img
                    src={generateOptimizedUrl(primaryImage.url)}
                    alt={primaryImage.alt_text || product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                {!primaryImage && (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <h4 className="font-medium text-xs truncate">{product.name}</h4>
              <p className="text-primary font-semibold text-xs">S/ {product.base_price.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
      {featuredProducts.length === 0 && (
        <div className="text-center py-4 bg-secondary/30 rounded-lg">
          <p className="text-muted-foreground text-sm">No hay productos para mostrar en preview</p>
        </div>
      )}
    </CardContent>
  </Card>
);
