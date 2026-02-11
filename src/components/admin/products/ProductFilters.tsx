import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  showOnlyDiscounted: boolean;
  onShowOnlyDiscountedChange: (v: boolean) => void;
  brands?: { id: string; name: string }[];
  selectedBrandId?: string | undefined;
  onBrandChange?: (id?: string) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  onNew?: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  showOnlyDiscounted,
  onShowOnlyDiscountedChange,
  brands = [],
  selectedBrandId,
  onBrandChange,
  pageSize,
  setPageSize,
  onNew,
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => setLocalSearch(searchTerm), [searchTerm]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => onSearchChange(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  return (
    <div className="flex flex-wrap gap-2 items-center mt-4">
      <div className="flex items-center gap-2">
        <Label className="sr-only">Buscar</Label>
        <Input placeholder="Buscar productos..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
      </div>

      <div className="flex items-center gap-2">
        <Label>Marca</Label>
        <Select onValueChange={(v) => onBrandChange?.(v === "all" ? undefined : v)} value={selectedBrandId || "all"}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label>Descuento</Label>
        <Button variant={showOnlyDiscounted ? "default" : "ghost"} onClick={() => onShowOnlyDiscountedChange(!showOnlyDiscounted)}>
          {showOnlyDiscounted ? "Solo con descuento" : "Mostrar todos"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label>Tamaño página</Label>
        <Select onValueChange={(v) => setPageSize(Number(v))} value={String(pageSize)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onNew && (
        <div className="ml-auto">
          <Button onClick={onNew}>Nuevo producto</Button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
