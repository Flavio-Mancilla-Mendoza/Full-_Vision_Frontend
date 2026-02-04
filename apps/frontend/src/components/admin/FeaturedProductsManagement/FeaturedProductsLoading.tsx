import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export const FeaturedProductsLoading: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Star className="w-5 h-5" />
        Productos Destacados
      </CardTitle>
      <CardDescription>Administra los productos que aparecen en la página principal</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Cargando productos...</p>
      </div>
    </CardContent>
  </Card>
);
