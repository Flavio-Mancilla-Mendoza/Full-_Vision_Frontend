import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Power, Trash2, AlertTriangle, Phone } from "lucide-react";
import { LocationActions } from "./LocationActions";
import type { Location } from "@/types/location";

interface LocationRowProps {
  location: Location;
  hasAppointments: boolean;
  onEdit: (location: Location) => void;
  onToggleActive: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export const LocationRow: React.FC<LocationRowProps> = ({ location, hasAppointments, onEdit, onToggleActive, onDelete }) => (
  <TableRow key={location.id}>
    <TableCell className="font-medium">
      <div className="flex items-center gap-2">
        {location.name}
        {hasAppointments && (
          <div title="Esta ubicación tiene citas asociadas">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        )}
      </div>
    </TableCell>
    <TableCell>{location.city}</TableCell>
    <TableCell className="max-w-xs truncate">{location.address}</TableCell>
    <TableCell>
      {location.phone ? (
        <div className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {location.phone}
        </div>
      ) : (
        "-"
      )}
    </TableCell>
    <TableCell>{location.business_hours || "-"}</TableCell>
    <TableCell>
      <Badge variant={location.is_active ? "default" : "secondary"}>{location.is_active ? "Activa" : "Inactiva"}</Badge>
    </TableCell>
    <TableCell className="text-right">
      <LocationActions location={location} onEdit={onEdit} onToggleActive={onToggleActive} onDelete={onDelete} />
    </TableCell>
  </TableRow>
);
