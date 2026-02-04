import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";

export const LocationHeader: React.FC<{
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
}> = ({ searchTerm, onSearchChange, onCreate }) => {
  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <SearchBar value={searchTerm} onDebouncedChange={onSearchChange} placeholder="Buscar ubicaciones..." />
      </div>
      <div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Ubicación
        </Button>
      </div>
    </div>
  );
};

export default LocationHeader;
