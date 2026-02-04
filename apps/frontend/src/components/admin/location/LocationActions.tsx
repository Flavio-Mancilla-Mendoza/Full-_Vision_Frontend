import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Power, Trash2 } from "lucide-react";
import type { Location } from "@/types/location";

interface LocationActionsProps {
  location: Location;
  onEdit: (location: Location) => void;
  onToggleActive: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export const LocationActions: React.FC<LocationActionsProps> = ({ location, onEdit, onToggleActive, onDelete }) => (
  <div className="flex justify-end gap-2">
    <Button variant="outline" size="sm" onClick={() => onEdit(location)} title="Editar ubicación">
      <Edit className="w-4 h-4" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onToggleActive(location)}
      title={location.is_active ? "Desactivar ubicación" : "Activar ubicación"}
      className={location.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
    >
      <Power className="w-4 h-4" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDelete(location)}
      title="Eliminar ubicación"
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);
