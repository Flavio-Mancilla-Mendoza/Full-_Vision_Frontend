/**
 * Componente FilterSidebar
 * Sidebar con todos los filtros de productos
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, ChevronDown } from "lucide-react";
import { DynamicFilters } from "@/components/products/DynamicFilters";
import { formatPrice } from "@/lib/product-utils";
import { type DynamicAttribute } from "@/services/dynamicAttributes";

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface FilterState {
  cyber_discount: string[];
  brand: string[];
  price_min: number;
  price_max: number;
  [key: string]: string[] | number;
}

interface FilterSidebarProps {
  filters: FilterState;
  openSections: Record<string, boolean>;
  activeFiltersCount: number;
  discounts: FilterOption[];
  brands: FilterOption[];
  priceRange: PriceRange;
  dynamicAttributes: DynamicAttribute[];
  onToggleFilter: (filterKey: keyof FilterState, value: string) => void;
  onUpdateFilter: (filterKey: keyof FilterState, value: string[] | number) => void;
  onToggleSection: (slug: string) => void;
  onClearFilters: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  openSections,
  activeFiltersCount,
  discounts,
  brands,
  priceRange,
  dynamicAttributes,
  onToggleFilter,
  onUpdateFilter,
  onToggleSection,
  onClearFilters,
}) => {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
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
          onOpenChange={() => onToggleSection("cyber_discount")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
            <h3 className="text-sm font-medium">Descuentos Cyber</h3>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                openSections.cyber_discount ? "" : "-rotate-90"
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-2">
              {discounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay descuentos disponibles
                </p>
              ) : (
                discounts.map((discount) => (
                  <div key={discount.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cyber-${discount.value}`}
                      checked={filters.cyber_discount.includes(discount.value)}
                      onCheckedChange={() =>
                        onToggleFilter("cyber_discount", discount.value)
                      }
                    />
                    <Label
                      htmlFor={`cyber-${discount.value}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
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
        <Collapsible
          open={openSections.brand}
          onOpenChange={() => onToggleSection("brand")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
            <h3 className="text-sm font-medium">Marca</h3>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                openSections.brand ? "" : "-rotate-90"
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay marcas disponibles
                </p>
              ) : (
                brands.map((brand) => (
                  <div key={brand.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.value}`}
                      checked={filters.brand.includes(brand.value)}
                      onCheckedChange={() => onToggleFilter("brand", brand.value)}
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
        <Collapsible
          open={openSections.price}
          onOpenChange={() => onToggleSection("price")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
            <h3 className="text-sm font-medium">Precio</h3>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                openSections.price ? "" : "-rotate-90"
              }`}
            />
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
                    onUpdateFilter("price_min", min);
                    onUpdateFilter("price_max", max);
                  }}
                  max={priceRange.max}
                  min={priceRange.min}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPrice(priceRange.min)}</span>
                <span>{formatPrice(priceRange.max)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Filtros Dinámicos */}
        <DynamicFilters
          attributes={dynamicAttributes}
          filters={Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => Array.isArray(v))
          ) as Record<string, string[]>}
          openSections={openSections}
          onToggleSection={onToggleSection}
          onToggleFilter={(slug, value) =>
            onToggleFilter(slug as keyof FilterState, value)
          }
        />
      </CardContent>
    </Card>
  );
};
