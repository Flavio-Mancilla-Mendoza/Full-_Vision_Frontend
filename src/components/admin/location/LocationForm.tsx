import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LocationFormData } from "@/types/location";

interface LocationFormProps {
  formData: LocationFormData;
  onChange: (data: LocationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  editingLocation: boolean;
}

export const LocationForm: React.FC<LocationFormProps> = ({ formData, onChange, onSubmit, editingLocation }) => (
  <form onSubmit={onSubmit}>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={formData.name} onChange={(e) => onChange({ ...formData, name: e.target.value })} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" value={formData.city} onChange={(e) => onChange({ ...formData, city: e.target.value })} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" value={formData.address} onChange={(e) => onChange({ ...formData, address: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={formData.phone} onChange={(e) => onChange({ ...formData, phone: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business_hours">Horario</Label>
          <Input
            id="business_hours"
            value={formData.business_hours}
            onChange={(e) => onChange({ ...formData, business_hours: e.target.value })}
            placeholder="10:00-19:00"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => onChange({ ...formData, is_active: checked })} />
        <Label htmlFor="is_active">Ubicación activa</Label>
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">{editingLocation ? "Actualizar" : "Crear"}</Button>
    </DialogFooter>
  </form>
);
