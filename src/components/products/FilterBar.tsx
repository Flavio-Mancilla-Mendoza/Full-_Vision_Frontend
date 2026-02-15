/**
 * FilterBar - Barra horizontal de filtros con dropdowns
 * Filtros estáticos/establecidos sin lógica dinámica
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
import { PRICE_RANGES, COLOR_OPTIONS, SHAPE_OPTIONS, MATERIAL_OPTIONS } from "@/lib/filter-constants";

// ======================= INTERFACES =======================

interface BrandOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  brands: BrandOption[];
  selectedBrands: string[];
  priceMin: number;
  priceMax: number;
  selectedColors: string[];
  selectedShapes: string[];
  selectedMaterials: string[];
  sortBy: string;
  activeFiltersCount: number;
  onToggleBrand: (brand: string) => void;
  onPriceChange: (min: number, max: number) => void;
  onToggleColor: (color: string) => void;
  onToggleShape: (shape: string) => void;
  onToggleMaterial: (material: string) => void;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

// ======================= COMPONENTE =======================

export const FilterBar: React.FC<FilterBarProps> = ({
  brands,
  selectedBrands,
  priceMin,
  priceMax,
  selectedColors,
  selectedShapes,
  selectedMaterials,
  sortBy,
  activeFiltersCount,
  onToggleBrand,
  onPriceChange,
  onToggleColor,
  onToggleShape,
  onToggleMaterial,
  onSortChange,
  onClearFilters,
}) => {
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
                {brand.label}
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

      {/* Color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${selectedColors.length > 0 ? "border-primary text-primary" : ""}`}
          >
            Color
            {selectedColors.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {selectedColors.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Filtrar por color
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {COLOR_OPTIONS.map((color) => (
            <DropdownMenuCheckboxItem
              key={color.value}
              checked={selectedColors.includes(color.value)}
              onCheckedChange={() => onToggleColor(color.value)}
              onSelect={(e) => e.preventDefault()}
            >
              {color.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Forma */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${selectedShapes.length > 0 ? "border-primary text-primary" : ""}`}
          >
            Forma
            {selectedShapes.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {selectedShapes.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Filtrar por forma
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SHAPE_OPTIONS.map((shape) => (
            <DropdownMenuCheckboxItem
              key={shape.value}
              checked={selectedShapes.includes(shape.value)}
              onCheckedChange={() => onToggleShape(shape.value)}
              onSelect={(e) => e.preventDefault()}
            >
              {shape.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Material */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 ${selectedMaterials.length > 0 ? "border-primary text-primary" : ""}`}
          >
            Material
            {selectedMaterials.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {selectedMaterials.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Filtrar por material
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MATERIAL_OPTIONS.map((material) => (
            <DropdownMenuCheckboxItem
              key={material.value}
              checked={selectedMaterials.includes(material.value)}
              onCheckedChange={() => onToggleMaterial(material.value)}
              onSelect={(e) => e.preventDefault()}
            >
              {material.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
