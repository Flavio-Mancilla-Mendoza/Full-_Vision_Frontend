import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Power, Trash2, AlertTriangle, Phone } from "lucide-react";
import type { Location } from "@/types/location";
import { LocationRow } from "./LocationRow";

interface LocationTableProps {
  locations: Location[];
  locationsWithAppointments: Set<string>;
  onEdit: (location: Location) => void;
  onToggleActive: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export const LocationTable: React.FC<LocationTableProps> = ({ locations, locationsWithAppointments, onEdit, onToggleActive, onDelete }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Nombre</TableHead>
        <TableHead>Ciudad</TableHead>
        <TableHead>Dirección</TableHead>
        <TableHead>Teléfono</TableHead>
        <TableHead>Horario</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {locations.map((location) => (
        <LocationRow
          key={location.id}
          location={location}
          hasAppointments={locationsWithAppointments.has(location.id)}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </TableBody>
  </Table>
);
