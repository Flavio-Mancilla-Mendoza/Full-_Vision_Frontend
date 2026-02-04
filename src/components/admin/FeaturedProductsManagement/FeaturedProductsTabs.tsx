import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Package } from "lucide-react";
import { FeaturedProductsList } from "./FeaturedProductsList";
import type { OpticalProduct } from "@/types";

interface FeaturedProductsTabsProps {
  featuredProducts: OpticalProduct[];
  availableProducts: OpticalProduct[];
  loading: boolean;
  handleToggleFeatured: (productId: string, featured: boolean) => void;
}

export const FeaturedProductsTabs: React.FC<FeaturedProductsTabsProps> = ({
  featuredProducts,
  availableProducts,
  loading,
  handleToggleFeatured,
}) => (
  <Tabs defaultValue="featured" className="space-y-4">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="featured" className="flex items-center gap-2">
        <Star className="w-4 h-4" />
        Destacados ({featuredProducts.length}/8)
      </TabsTrigger>
      <TabsTrigger value="available" className="flex items-center gap-2">
        <Package className="w-4 h-4" />
        Disponibles ({availableProducts.length})
      </TabsTrigger>
    </TabsList>

    <TabsContent value="featured" className="space-y-4">
      {featuredProducts.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay productos destacados</p>
          <p className="text-sm text-muted-foreground mt-1">Ve a la pestaña "Disponibles" para marcar productos como destacados</p>
        </div>
      ) : (
        <FeaturedProductsList products={featuredProducts} isFeatured={true} loading={loading} handleToggleFeatured={handleToggleFeatured} />
      )}
    </TabsContent>

    <TabsContent value="available" className="space-y-4">
      {availableProducts.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay productos disponibles para destacar</p>
          <p className="text-sm text-muted-foreground mt-1">Todos los productos activos ya están destacados</p>
        </div>
      ) : (
        <FeaturedProductsList
          products={availableProducts}
          isFeatured={false}
          loading={loading}
          handleToggleFeatured={handleToggleFeatured}
        />
      )}
    </TabsContent>
  </Tabs>
);
