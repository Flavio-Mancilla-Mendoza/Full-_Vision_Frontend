import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter, X, SlidersHorizontal, Home, ChevronRight, ChevronDown, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductsByGender, useDynamicFiltersForGender, useDynamicAttributesForGender } from "@/hooks/useProductsByGender";
import { type ProductFilters } from "@/services/productCategories";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { ProductCard } from "@/components/products/ProductCard";
import { DynamicFilters } from "@/components/products/DynamicFilters";
import { ProductsErrorFallback } from "@/components/common/ErrorFallback";
import SEO from "@/components/common/SEO";
import { IProduct } from "@/types/IProducts";

interface FilterState {
  cyber_discount: string[];
  brand: string[];
  price_min: number;
  price_max: number;
  [key: string]: string[] | number;
}

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

  // Estados locales para UI y filtros
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 24;

  // Estados para controlar los acordeones
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cyber_discount: false,
    brand: false,
    price: false,
  });

  // Estados de filtros locales (UI)
  const [filters, setFilters] = useState<FilterState>({
    cyber_discount: [],
    brand: [],
    price_min: 0,
    price_max: 999999,
  });

  // Cargar filtros dinámicos y atributos
  const { data: dynamicFiltersData, isLoading: isLoadingFilters } = useDynamicFiltersForGender(gender);
  const { data: dynamicAttributes, isLoading: isLoadingAttributes } = useDynamicAttributesForGender(gender);

  // Construir filtros para el backend
  const backendFilters: ProductFilters = {
    gender,
    brands: filters.brand,
    discount_min: filters.cyber_discount.length > 0 
      ? Math.min(...filters.cyber_discount.map(d => parseInt(d))) 
      : undefined,
    price_min: filters.price_min,
    price_max: filters.price_max,
    attributes: Object.entries(filters)
      .filter(([key, value]) => 
        !['cyber_discount', 'brand', 'price_min', 'price_max'].includes(key) && 
        Array.isArray(value) && 
        value.length > 0
      )
      .reduce((acc, [key, value]) => {
        acc[key] = value as string[];
        return acc;
      }, {} as Record<string, string[]>),
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
  } = useProductsByGender(backendFilters);

  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();

  // Actualizar rangos de precio cuando se cargan los filtros dinámicos
  useEffect(() => {
    if (dynamicFiltersData?.priceRange) {
      setFilters((prev) => ({
        ...prev,
        price_min: dynamicFiltersData.priceRange.min,
        price_max: dynamicFiltersData.priceRange.max,
      }));
    }
  }, [dynamicFiltersData]);

  // Resetear a página 1 cuando cambien los filtros o el ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const updateFilter = (filterKey: keyof FilterState, value: string[] | number) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const toggleFilterValue = (filterKey: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: (prev[filterKey] as string[]).includes(value)
        ? (prev[filterKey] as string[]).filter((v) => v !== value)
        : [...(prev[filterKey] as string[]), value],
    }));
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      cyber_discount: [],
      brand: [],
      price_min: dynamicFiltersData?.priceRange?.min ?? 0,
      price_max: dynamicFiltersData?.priceRange?.max ?? 999999,
    };
    (dynamicAttributes ?? []).forEach((attr) => {
      clearedFilters[attr.slug] = [];
    });
    setFilters(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = filters.cyber_discount.length + filters.brand.length;

    (dynamicAttributes ?? []).forEach((attr) => {
      const filterValues = filters[attr.slug] as string[] | undefined;
      if (filterValues && filterValues.length > 0) {
        count += filterValues.length;
      }
    });

    const defaultMin = dynamicFiltersData?.priceRange?.min ?? 0;
    const defaultMax = dynamicFiltersData?.priceRange?.max ?? 999999;
    if (filters.price_min > defaultMin || filters.price_max < defaultMax) {
      count += 1;
    }

    return count;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  const handleAddToCart = (product: IProduct) => {
    const opticalProduct = {
      ...product,
      brand: product.brand ? {
        id: product.id,
        name: product.brand.name,
        slug: product.slug,
        logo_url: "",
        description: "",
        is_active: true,
        created_at: "",
        updated_at: "",
      } : undefined,
      category: undefined,
      product_images: [],
    };

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

  if (isProductsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductsErrorFallback error={productsError} onRetry={() => refetchProducts()} />
      </div>
    );
  }

  const products = productsResponse?.products ?? [];
  const totalProducts = productsResponse?.total ?? 0;
  const totalPages = productsResponse?.totalPages ?? 1;
  const hasMore = productsResponse?.hasMore ?? false;

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
              Filtros {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
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
            <Card className="sticky top-4">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Filtros</span>
                  {getActiveFiltersCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Descuentos Cyber */}
                <Collapsible
                  open={openSections.cyber_discount}
                  onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, cyber_discount: open }))}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="text-sm font-medium">Descuentos Cyber</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.cyber_discount ? "" : "-rotate-90"}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="space-y-2">
                      {(dynamicFiltersData?.discounts ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay descuentos disponibles</p>
                      ) : (
                        (dynamicFiltersData?.discounts ?? []).map((discount) => (
                          <div key={discount.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cyber-${discount.value}`}
                              checked={filters.cyber_discount.includes(discount.value)}
                              onCheckedChange={() => toggleFilterValue("cyber_discount", discount.value)}
                            />
                            <Label htmlFor={`cyber-${discount.value}`} className="text-sm cursor-pointer flex items-center gap-2">
                              {discount.label}
                              <Badge variant="outline" className="text-xs">
                                {discount.count}
                              </Badge>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Marca */}
                <Collapsible open={openSections.brand} onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, brand: open }))}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="text-sm font-medium">Marca</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.brand ? "" : "-rotate-90"}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(dynamicFiltersData?.brands ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay marcas disponibles</p>
                      ) : (
                        (dynamicFiltersData?.brands ?? []).map((brand) => (
                          <div key={brand.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`brand-${brand.value}`}
                              checked={filters.brand.includes(brand.value)}
                              onCheckedChange={() => toggleFilterValue("brand", brand.value)}
                            />
                            <Label
                              htmlFor={`brand-${brand.value}`}
                              className="text-sm cursor-pointer flex items-center justify-between w-full"
                            >
                              <span>{brand.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {brand.count}
                              </Badge>
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Precio */}
                <Collapsible open={openSections.price} onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, price: open }))}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="text-sm font-medium">Precio</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? "" : "-rotate-90"}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(filters.price_min)} - {formatPrice(filters.price_max)}
                      </p>
                      <div className="px-2">
                        <Slider
                          value={[filters.price_min, filters.price_max]}
                          onValueChange={([min, max]) => {
                            updateFilter("price_min", min);
                            updateFilter("price_max", max);
                          }}
                          max={dynamicFiltersData?.priceRange?.max ?? 1000}
                          min={dynamicFiltersData?.priceRange?.min ?? 0}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatPrice(dynamicFiltersData?.priceRange?.min ?? 0)}</span>
                        <span>{formatPrice(dynamicFiltersData?.priceRange?.max ?? 1000)}</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Filtros Dinámicos */}
                <DynamicFilters
                  attributes={dynamicAttributes ?? []}
                  filters={Object.fromEntries(Object.entries(filters).filter(([_, v]) => Array.isArray(v))) as Record<string, string[]>}
                  openSections={openSections}
                  onToggleSection={(slug) => setOpenSections((prev) => ({ ...prev, [slug]: !prev[slug] }))}
                  onToggleFilter={(slug, value) => toggleFilterValue(slug as keyof FilterState, value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Grid de Productos */}
          <div className="lg:col-span-3">
            {products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <SlidersHorizontal className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                    <p>Intenta ajustar los filtros para encontrar lo que buscas</p>
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Ver todos los productos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      image_url={product.image_url}
                      image_alt={product.name}
                      base_price={product.base_price}
                      sale_price={product.sale_price}
                      discount_percentage={product.discount_percentage}
                      brand_name={product.brand?.name}
                      onAddToCart={() => handleAddToCart(product)}
                      isAddingToCart={isAddingToCart && addingProductId === product.id}
                      isInCart={cartItems.some((item) => item.id === product.id)}
                      quantity={cartItems.find((item) => item.id === product.id)?.quantity || 0}
                      loading={index >= 6 ? "lazy" : "eager"}
                      index={index}
                    />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>

                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Mostrar solo páginas cercanas a la actual
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={!hasMore}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
