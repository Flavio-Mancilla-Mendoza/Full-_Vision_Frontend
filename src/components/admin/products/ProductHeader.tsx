import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Package } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";

export const ProductHeader: React.FC<{
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  showOnlyDiscounted: boolean;
  setShowOnlyDiscounted: (v: boolean) => void;
  onNew: () => void;
}> = ({ searchTerm, setSearchTerm, showOnlyDiscounted, setShowOnlyDiscounted, onNew }) => {
  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5" />
      </div>

      <div className="relative flex-1">
        <SearchBar value={searchTerm} onDebouncedChange={setSearchTerm} placeholder="Buscar productos..." />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="show-discounted" checked={showOnlyDiscounted} onCheckedChange={setShowOnlyDiscounted} />
        <Label htmlFor="show-discounted" className="text-sm whitespace-nowrap cursor-pointer">
          Solo con descuento
        </Label>
      </div>

      <div>
        <Button onClick={onNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>
    </div>
  );
};

export default ProductHeader;
