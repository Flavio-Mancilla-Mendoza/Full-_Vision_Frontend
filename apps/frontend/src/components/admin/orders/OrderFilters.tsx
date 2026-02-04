import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const OrderFilters: React.FC<{
  tempSearchTerm: string;
  setTempSearchTerm: (v: string) => void;
  tempStatusFilter: string;
  setTempStatusFilter: (v: string) => void;
  tempDateFrom: string;
  setTempDateFrom: (v: string) => void;
  tempDateTo: string;
  setTempDateTo: (v: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}> = ({
  tempSearchTerm,
  setTempSearchTerm,
  tempStatusFilter,
  setTempStatusFilter,
  tempDateFrom,
  setTempDateFrom,
  tempDateTo,
  setTempDateTo,
  applyFilters,
  clearFilters,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Número de orden, nombre, email..."
                value={tempSearchTerm}
                onChange={(e) => setTempSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={tempStatusFilter} onValueChange={setTempStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="ready_for_pickup">Listo para Recojo</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Desde</Label>
            <Input
              type="text"
              placeholder="DD-MM-YYYY (ej: 21-12-2025)"
              value={tempDateFrom}
              onChange={(e) => setTempDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input
              type="text"
              placeholder="DD-MM-YYYY (ej: 25-12-2025)"
              value={tempDateTo}
              onChange={(e) => setTempDateTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button onClick={clearFilters} variant="outline">
            Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderFilters;
