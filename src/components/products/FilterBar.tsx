/**
 * FilterBar - Barra horizontal de filtros con dropdowns
 * Reemplaza el FilterSidebar vertical con una barra compacta
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { X, ChevronDown } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface FilterBarProps {
  // Datos de filtros
  brands: FilterOption[];
  discounts: FilterOption[];
  priceRange: PriceRange;
  // Estado actual
  selectedBrands: string[];
  selectedDiscounts: string[];
  priceMin: number;
  priceMax: number;
  sortBy: string;
  activeFiltersCount: number;
  // Callbacks
  onToggleBrand: (brand: string) => void;
  onToggleDiscount: (discount: string) => void;
  onSortChange: (value: string) => void;
  onPriceChange: (min: number, max: number) => void;
  onClearFilters: () => void;
}

// Rangos de precio predefinidos para el dropdown
const PRICE_RANGES = [
  { label: "Todos los precios", min: 0, max: 999999 },
  { label: "Hasta S/ 200", min: 0, max: 200 },
  { label: "S/ 200 - S/ 500", min: 200, max: 500 },
  { label: "S/ 500 - S/ 1,000", min: 500, max: 1000 },
  { label: "Más de S/ 1,000", min: 1000, max: 999999 },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  brands,
  discounts,
  priceRange,
  selectedBrands,
  selectedDiscounts,
  priceMin,
  priceMax,
  sortBy,
  activeFiltersCount,
  onToggleBrand,
  onToggleDiscount,
  onSortChange,
  onPriceChange,
  onClearFilters,
}) => {
  // Determinar etiqueta de precio actual
  const currentPriceLabel =
    priceMin === 0 && priceMax >= 999999
      ? "Precio"
      : PRICE_RANGES.find((r) => r.min === priceMin && r.max === priceMax)
          ?.label ?? `S/ ${priceMin} - S/ ${priceMax}`;

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-border">
      {/* Marca */}
      {brands.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Marca
              {selectedBrands.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {selectedBrands.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Filtrar por marca
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {brands.map((brand) => (
              <DropdownMenuCheckboxItem
                key={brand.value}
                checked={selectedBrands.includes(brand.value)}
                onCheckedChange={() => onToggleBrand(brand.value)}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex-1">{brand.label}</span>
                <span className="text-xs text-muted-foreground ml-2">({brand.count})</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Precio */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${
              priceMin > 0 || priceMax < 999999 ? "border-primary text-primary" : ""
            }`}
          >
            {currentPriceLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Rango de precio
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRICE_RANGES.map((range) => (
            <DropdownMenuCheckboxItem
              key={range.label}
              checked={priceMin === range.min && priceMax === range.max}
              onCheckedChange={() => onPriceChange(range.min, range.max)}
            >
              {range.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Descuento */}
      {discounts.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 ${
                selectedDiscounts.length > 0 ? "border-primary text-primary" : ""
              }`}
            >
              Descuento
              {selectedDiscounts.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {selectedDiscounts.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Filtrar por descuento
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {discounts.map((discount) => (
              <DropdownMenuCheckboxItem
                key={discount.value}
                checked={selectedDiscounts.includes(discount.value)}
                onCheckedChange={() => onToggleDiscount(discount.value)}
                onSelect={(e) => e.preventDefault()}
              >
                <span className="flex-1">{discount.label}</span>
                <span className="text-xs text-muted-foreground ml-2">({discount.count})</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Ordenar */}
      <div className="ml-auto">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-44 h-9 text-sm">
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

      {/* Limpiar filtros */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
};
