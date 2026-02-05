import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Home, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductsByGender, useDynamicFiltersForGender, useDynamicAttributesForGender } from "@/hooks/useProductsByGender";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { useProductFilters } from "@/hooks/useProductFilters";
import { ProductsErrorFallback } from "@/components/common/ErrorFallback";
import { FilterSidebar } from "@/components/products/FilterSidebar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/products/Pagination";
import { transformProductForCart } from "@/lib/product-utils";
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
  breadcrumbLabel 
}) => {
  const navigate = useNavigate();

  // Estados locales para UI
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 24;

  // Cargar filtros dinámicos y atributos
  const { data: dynamicFiltersData, isLoading: isLoadingFilters } = useDynamicFiltersForGender(gender);
  const { data: dynamicAttributes, isLoading: isLoadingAttributes } = useDynamicAttributesForGender(gender);

  // Hook personalizado para manejar filtros (lógica de negocio separada)
  const {
    filters,
    backendFilters,
    openSections,
    activeFiltersCount,
    updateFilter,
    toggleFilterValue,
    clearFilters,
    toggleSection,
  } = useProductFilters(gender, {
    defaultPriceRange: dynamicFiltersData?.priceRange,
    dynamicAttributes: dynamicAttributes ?? [],
  });

  // Agregar sort_by y paginación a los filtros del backend
  const queryFilters = {
    ...backendFilters,
    sort_by: sortBy,
    page: currentPage,
    limit,
  };

  // Query de productos CON FILTROS EN BACKEND
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsByGender(queryFilters);

  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();

  // Resetear a página 1 cuando cambien los filtros o el ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const handleAddToCart = (product: IProduct) => {
    const opticalProduct = transformProductForCart(product);
    addToCart({
      productId: product.id,
      quantity: 1,
      product: opticalProduct,
    });
  };

  // Paginación
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Datos de respuesta
  const products = productsResponse?.products ?? [];
  const totalProducts = productsResponse?.total ?? 0;
  const totalPages = productsResponse?.totalPages ?? 1;
  const hasMore = productsResponse?.hasMore ?? false;

  // Loading states
  if (isLoadingProducts || isLoadingFilters || isLoadingAttributes) {
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

  // Error state
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
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </button>
            <ChevronRight className="h-4 w-4" />
            <span>Lentes de Sol</span>
            <ChevronRight className="h-4 w-4" />
            <span>Categorías</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{breadcrumbLabel}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} className="hidden md:flex">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </div>

        {/* Controles superiores */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <Filter className="h-4 w-4 mr-2" />
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destacados</SelectItem>
                <SelectItem value="price_asc">Menor Precio</SelectItem>
                <SelectItem value="price_desc">Mayor Precio</SelectItem>
                <SelectItem value="discount">Mayor Descuento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Badge variant="secondary">{totalProducts} productos encontrados</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de Filtros */}
          <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
            <FilterSidebar
              filters={filters}
              openSections={openSections}
              activeFiltersCount={activeFiltersCount}
              discounts={dynamicFiltersData?.discounts ?? []}
              brands={dynamicFiltersData?.brands ?? []}
              priceRange={dynamicFiltersData?.priceRange ?? { min: 0, max: 1000 }}
              dynamicAttributes={dynamicAttributes ?? []}
              onToggleFilter={toggleFilterValue}
              onUpdateFilter={updateFilter}
              onToggleSection={toggleSection}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Grid de Productos */}
          <div className="lg:col-span-3">
            <ProductGrid
              products={products}
              cartItems={cartItems}
              isAddingToCart={isAddingToCart}
              addingProductId={addingProductId}
              onAddToCart={handleAddToCart}
              onClearFilters={clearFilters}
            />

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasMore={hasMore}
              onPageChange={goToPage}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
