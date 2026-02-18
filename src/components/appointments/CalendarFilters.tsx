// src/components/appointments/CalendarFilters.tsx
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Location } from "@/types/location";

interface CalendarFiltersProps {
  locations: Location[];
  selectedLocation: string;
  selectedStatus: string;
  loading: boolean;
  onLocationChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
}

export function CalendarFilters({
  locations,
  selectedLocation,
  selectedStatus,
  loading,
  onLocationChange,
  onStatusChange,
  onRefresh,
}: CalendarFiltersProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        <span className="text-sm text-muted-foreground">Filtros:</span>
      </div>

      <Select value={selectedLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Seleccionar ubicación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Todas las ubicaciones
            {locations.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({locations.length})
              </span>
            )}
          </SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
              {location.city && (
                <span className="ml-1 text-xs text-muted-foreground">
                  - {location.city}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Seleccionar estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="requested">Pendientes</SelectItem>
          <SelectItem value="confirmed">Confirmadas</SelectItem>
          <SelectItem value="completed">Completadas</SelectItem>
          <SelectItem value="cancelled">Canceladas</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        {loading ? "Cargando..." : "Actualizar"}
      </Button>
    </div>
  );
}
