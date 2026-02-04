import React from "react";
import { ProductCard } from "./ProductCard";
import type { OpticalProduct } from "@/types";

interface FeaturedProductsListProps {
  products: OpticalProduct[];
  isFeatured: boolean;
  loading: boolean;
  handleToggleFeatured: (productId: string, featured: boolean) => void;
}

export const FeaturedProductsList: React.FC<FeaturedProductsListProps> = ({ products, isFeatured, loading, handleToggleFeatured }) => (
  <div className="space-y-3">
    {products.map((product) => (
      <ProductCard
        key={product.id}
        product={product}
        isFeatured={isFeatured}
        loading={loading}
        handleToggleFeatured={handleToggleFeatured}
      />
    ))}
  </div>
);
