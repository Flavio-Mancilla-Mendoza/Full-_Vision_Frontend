import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter, X, SlidersHorizontal, Home, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProductsByGender, getDynamicFiltersForGender } from "@/services/productCategories";
import { OpticalProduct } from "@/services/admin";
import { convertProductWithBrandToOpticalProduct } from "@/lib/convertProductWithBrand";
import { DbProduct } from "@/types";
import type { IProduct, IProductCategory } from "@/types/IProducts";
import { useOptimizedAuthCart } from "@/hooks/useOptimizedAuthCart";
import { ProductCard } from "@/components/products/ProductCard";
import { DynamicFilters } from "@/components/products/DynamicFilters";
import SEO from "@/components/common/SEO";

// Tipo para productos con marca básica desde Supabase join
type ProductWithBrand = DbProduct & {
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category?: IProductCategory | null;
};

interface DynamicFiltersData {
  discounts: {
    value: string;
    label: string;
    min: number;
    max: number;
    count: number;
  }[];
  brands: {
    value: string;
    label: string;
    count: number;
  }[];
  priceRange: {
    min: number;
    max: number;
  };
}

interface FilterState {
  cyber_discount: string[]; // "20%", "30%", "50%"
  brand: string[];
  price_min: number;
  price_max: number;
  [key: string]: string[] | number; // Atributos dinámicos
}

const CYBER_DISCOUNT_OPTIONS = [
  { label: "20% DCTO", value: "20", min: 20, max: 20 },
  { label: "30% DCTO", value: "30", min: 30, max: 30 },
  { label: "50% DCTO", value: "50", min: 50, max: 50 },
];

const KidsProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithBrand[]>([]);
  const [dynamicFiltersData, setDynamicFiltersData] = useState<DynamicFiltersData>({
    discounts: [],
    brands: [],
    priceRange: { min: 0, max: 1000 },
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<string>("featured");

  // Estados para controlar los acordeones (dinámico)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cyber_discount: false,
    brand: false,
    price: false,
  });

  // Estados de filtros (solo negocio)
  const [filters, setFilters] = useState<FilterState>({
    cyber_discount: [],
    brand: [],
    price_min: 0,
    price_max: 1000,
  });

  const { addToCart, isAddingToCart, addingProductId, cartItems } = useOptimizedAuthCart();

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Ahora el backend filtra según los filtros de negocio
        const [productsData, filtersData] = await Promise.all([getProductsByGender("niños", filters), getDynamicFiltersForGender("niños")]);
        setProducts(productsData);
        setFilteredProducts(productsData);
        setDynamicFiltersData(filtersData);
        setFilters((prev) => ({
          ...prev,
          price_min: filtersData.priceRange.min,
          price_max: filtersData.priceRange.max,
        }));
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Aplicar filtros
  // Ya no se filtra en frontend, solo se actualiza el estado cuando cambian los productos
  // Si quieres re-filtrar, simplemente vuelve a llamar a loadData con los nuevos filtros

  const updateFilter = (filterKey: keyof FilterState, value: string[] | number) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
    // Aquí podrías volver a cargar productos llamando a loadData con los nuevos filtros
  };

  const clearFilters = () => {
    setFilters({
      cyber_discount: [],
      brand: [],
      price_min: 0,
      price_max: 1000,
    });
    // Aquí podrías volver a cargar productos con filtros limpios
  };

  const getActiveFiltersCount = () => {
    let count = filters.cyber_discount.length + filters.brand.length;
    if (filters.price_min > 0 || filters.price_max < 1000) {
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

  const handleAddToCart = (product: ProductWithBrand) => {
    // Convertir ProductWithBrand a OpticalProduct para el carrito
    const opticalProduct = convertProductWithBrandToOpticalProduct(product);
    addToCart({
      productId: product.id,
      quantity: 1,
      product: opticalProduct,
    });
  };

  if (loading) {
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

  return (
    <>
      <SEO
        title="Lentes para Niños | Full Vision"
        description="Descubre nuestra colección de lentes para niños con descuentos especiales. Filtros por marca, precio, talla y material."
        keywords="lentes niños, gafas infantiles, lentes sol niños, marcos niños"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumb con navegación */}
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
            <span className="text-foreground font-medium">Niños</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lentes para Niños</h1>
              <p className="text-muted-foreground">Encuentra los lentes perfectos para niños con descuentos especiales</p>
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

            <Select value={sortBy} onValueChange={setSortBy}>
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
            <span className="text-sm text-muted-foreground">Mostrar 12 por página</span>
            <Badge variant="secondary">{filteredProducts.length} productos encontrados</Badge>
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
                      {dynamicFiltersData.discounts.map((discount) => (
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
                      ))}
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
                      {dynamicFiltersData.brands.map((brand) => (
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
                      ))}
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
                          max={1000}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>S/ 0</span>
                        <span>S/ 1,000</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Filtros Dinámicos desde la Base de Datos */}
                <DynamicFilters
                  attributes={dynamicAttributes}
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
            {filteredProducts.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default KidsProducts;
