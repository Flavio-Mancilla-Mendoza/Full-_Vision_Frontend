// src/components/admin/FeaturedProductsManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { FeaturedProductsTabs } from "./FeaturedProductsManagement/FeaturedProductsTabs";
import { Star } from "lucide-react";
import {
  getFeaturedProducts,
  getAvailableProductsForFeatured,
  setProductAsFeatured,
  fixBrokenImageUrls,
  type OpticalProduct,
} from "@/services/admin";
import { FeaturedProductsPreview } from "./FeaturedProductsManagement/FeaturedProductsPreview";
import { FeaturedProductsLoading } from "./FeaturedProductsManagement/FeaturedProductsLoading";
import { FixBrokenImagesButton } from "./FeaturedProductsManagement/FixBrokenImagesButton";

export function FeaturedProductsManagement() {
  const [featuredProducts, setFeaturedProducts] = useState<OpticalProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<OpticalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [featured, available] = await Promise.all([getFeaturedProducts(), getAvailableProductsForFeatured()]);

      setFeaturedProducts(featured);
      setAvailableProducts(available);
    } catch (error) {
      console.error("Error loading featured products data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos destacados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    try {
      if (featured && featuredProducts.length >= 8) {
        toast({
          title: "Límite alcanzado",
          description: "Solo puedes tener máximo 8 productos destacados",
          variant: "destructive",
        });
        return;
      }

      await setProductAsFeatured(productId, featured);

      toast({
        title: "Éxito",
        description: featured ? "Producto marcado como destacado" : "Producto removido de destacados",
      });

      // Recargar datos
      await loadData();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del producto",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Productos Destacados
          </CardTitle>
          <CardDescription>Administra los productos que aparecen en la página principal</CardDescription>
        </CardHeader>
        <CardContent>
          <FeaturedProductsLoading />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Productos Destacados
        </CardTitle>
        <CardDescription>Administra los productos que aparecen en la página principal (máximo 8)</CardDescription>
      </CardHeader>
      <CardContent>
        <FeaturedProductsTabs
          featuredProducts={featuredProducts}
          availableProducts={availableProducts}
          handleToggleFeatured={handleToggleFeatured}
          loading={loading}
        />

        {/* Vista previa */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Vista previa en homepage</span>
            <FixBrokenImagesButton
              loading={loading}
              onFix={async () => {
                try {
                  setLoading(true);
                  const result = await fixBrokenImageUrls();
                  toast({
                    title: "Corrección completada",
                    description: `${result.fixed} imágenes corregidas, ${result.errors} errores`,
                  });
                  await loadData();
                } catch (error) {
                  console.error("Error corrigiendo URLs:", error);
                  toast({
                    title: "Error",
                    description: "No se pudieron corregir las URLs de imágenes",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
            />
          </div>

          {featuredProducts.length > 0 ? (
            <FeaturedProductsPreview featuredProducts={featuredProducts} />
          ) : (
            <div className="text-center py-4 bg-secondary/30 rounded-lg">
              <p className="text-muted-foreground text-sm">No hay productos para mostrar en preview</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
