/**
 * Componente ProductGrid
 * Grid de productos con estado de carga y vacío
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { IProduct } from "@/types/IProducts";

interface ProductGridProps {
  products: IProduct[];
  cartItems: Array<{ id: string; product_id: string; quantity: number }>;
  isAddingToCart: boolean;
  addingProductId: string | null | undefined;
  onAddToCart: (product: IProduct) => void;
  onClearFilters: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  cartItems,
  isAddingToCart,
  addingProductId,
  onAddToCart,
  onClearFilters,
}) => {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <SlidersHorizontal className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No se encontraron productos
            </h3>
            <p>Intenta ajustar los filtros para encontrar lo que buscas</p>
            <Button variant="outline" onClick={onClearFilters} className="mt-4">
              Ver todos los productos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          slug={product.slug}
          image_url={product.image_url}
          image_alt={product.name}
          base_price={product.base_price}
          sale_price={product.sale_price}
          discount_percentage={product.discount_percentage}
          brand_name={product.brand?.name}
          lens_type={product.lens_type}
          stock_quantity={product.stock_quantity}
          onAddToCart={() => onAddToCart(product)}
          isAddingToCart={isAddingToCart && addingProductId === product.id}
          isInCart={cartItems.some((item) => item.product_id === product.id)}
          quantity={
            cartItems.find((item) => item.product_id === product.id)?.quantity || 0
          }
          loading={index >= 6 ? "lazy" : "eager"}
          index={index}
        />
      ))}
    </div>
  );
};
