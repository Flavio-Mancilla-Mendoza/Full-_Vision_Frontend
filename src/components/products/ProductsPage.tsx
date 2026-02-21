import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProductsByGender } from "@/hooks/useProductsByGender";
import { useCart as useOptimizedAuthCart } from "@/hooks/cart";
import { ProductsErrorFallback } from "@/components/common/ErrorFallback";
import { FilterBar } from "@/components/products/FilterBar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/products/Pagination";
import { transformProductForCart } from "@/lib/product-utils";
import { getAllBrands } from "@/services/brands";
import SEO from "@/components/common/SEO";
import { IProduct } from "@/types/IProducts";

interface ProductsPageProps {
  gender: "hombre" | "mujer" | "niños";
  title: string;
  description: string;
  keywords: string;
  breadcrumbLabel: string;
}

const ProductsPage: React.FC<ProductsPageProps> = ({
  gender,
  title,
  description,
  keywords,
  breadcrumbLabel,
}) => {
  const navigate = useNavigate();

  // Estados de filtros
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(999999);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "discount">("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 24;

  // Cargar marcas desde la API (simple, sin filtros dinámicos)
  const { data: brandsData = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: getAllBrands,
    staleTime: 1000 * 60 * 30, // 30 minutos - las marcas no cambian frecuentemente
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const brandOptions = useMemo(
    () => brandsData.map((b) => ({ value: b.name, label: b.name })),
    [brandsData]
  );

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = selectedBrands.length + selectedColors.length + selectedShapes.length + selectedMaterials.length;
    if (priceMin > 0 || priceMax < 999999) count += 1;
    return count;
  }, [selectedBrands, selectedColors, selectedShapes, selectedMaterials, priceMin, priceMax]);

  // Construir filtros para el backend
  const queryFilters = useMemo(() => {
    const attributes: Record<string, string[]> = {};
    if (selectedColors.length > 0) attributes.frame_color = selectedColors;
    if (selectedShapes.length > 0) attributes.frame_style = selectedShapes;
    if (selectedMaterials.length > 0) attributes.frame_material = selectedMaterials;

    return {
      gender,
      brands: selectedBrands,
      price_min: priceMin,
      price_max: priceMax,
      attributes,
      sort_by: sortBy,
      page: currentPage,
      limit,
    };
  }, [gender, selectedBrands, priceMin, priceMax, selectedColors, selectedShapes, selectedMaterials, sortBy, currentPage]);

  // Query de productos
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsByGender(queryFilters);

  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();

  // Resetear a página 1 cuando cambian filtros u ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedColors, selectedShapes, selectedMaterials, priceMin, priceMax, sortBy]);

  // Handlers
  const handleAddToCart = (product: IProduct) => {
    const opticalProduct = transformProductForCart(product);
    addToCart({ productId: product.id, quantity: 1, product: opticalProduct as Parameters<typeof addToCart>[0]["product"] });
  };

  const toggleArrayFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceMin(min);
    setPriceMax(max);
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedShapes([]);
    setSelectedMaterials([]);
    setPriceMin(0);
    setPriceMax(999999);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Datos de respuesta
  const products = productsResponse?.products ?? [];
  const totalProducts = productsResponse?.total ?? 0;
  const totalPages = productsResponse?.totalPages ?? 1;
  const hasMore = productsResponse?.hasMore ?? false;

  // Loading
  if (isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isProductsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductsErrorFallback error={productsError} onRetry={() => refetchProducts()} />
      </div>
    );
  }

  return (
    <>
      <SEO title={title} description={description} keywords={keywords} />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb + Header */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button
              onClick={() => navigate("/")}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{breadcrumbLabel}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {totalProducts} productos
            </Badge>
          </div>
        </div>

        {/* Barra de filtros horizontal */}
        <FilterBar
          brands={brandOptions}
          selectedBrands={selectedBrands}
          priceMin={priceMin}
          priceMax={priceMax}
          selectedColors={selectedColors}
          selectedShapes={selectedShapes}
          selectedMaterials={selectedMaterials}
          sortBy={sortBy}
          activeFiltersCount={activeFiltersCount}
          onToggleBrand={toggleArrayFilter(setSelectedBrands)}
          onPriceChange={handlePriceChange}
          onToggleColor={toggleArrayFilter(setSelectedColors)}
          onToggleShape={toggleArrayFilter(setSelectedShapes)}
          onToggleMaterial={toggleArrayFilter(setSelectedMaterials)}
          onSortChange={(v) => setSortBy(v as typeof sortBy)}
          onClearFilters={clearFilters}
        />

        {/* Grid de productos (ancho completo) */}
        <div className="mt-6">
          <ProductGrid
            products={products}
            cartItems={cartItems}
            isAddingToCart={isAddingToCart}
            addingProductId={addingProductId}
            onAddToCart={handleAddToCart}
            onClearFilters={clearFilters}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasMore={hasMore}
            onPageChange={goToPage}
          />
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
