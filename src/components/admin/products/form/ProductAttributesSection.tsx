import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductFormData } from "@/types/product-forms";

interface ProductAttributesSectionProps {
  formData: ProductFormData;
  onChange: (data: Partial<ProductFormData>) => void;
}

export const ProductAttributesSection: React.FC<ProductAttributesSectionProps> = ({ formData, onChange }) => (
  <div className="border-t pt-6">
    <h3 className="text-lg font-semibold mb-4">Características del Producto</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="frame_material">Material del Marco</Label>
        <Select value={formData.frame_material || ""} onValueChange={(v) => onChange({ frame_material: v })}>
          <SelectTrigger id="frame_material">
            <SelectValue placeholder="Seleccionar material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="acetato">Acetato</SelectItem>
            <SelectItem value="metal">Metal</SelectItem>
            <SelectItem value="titanio">Titanio</SelectItem>
            <SelectItem value="plastico">Plástico</SelectItem>
            <SelectItem value="nylon">Nylon</SelectItem>
            <SelectItem value="mixto">Mixto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lens_type">Tipo de Lente</Label>
        <Select value={formData.lens_type || ""} onValueChange={(v) => onChange({ lens_type: v })}>
          <SelectTrigger id="lens_type">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sol">Sol</SelectItem>
            <SelectItem value="graduado">Graduado</SelectItem>
            <SelectItem value="fotocromático">Fotocromático</SelectItem>
            <SelectItem value="filtro-azul">Filtro Azul</SelectItem>
            <SelectItem value="lectura">Lectura</SelectItem>
            <SelectItem value="contacto">Contacto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frame_style">Estilo del Marco</Label>
        <Select value={formData.frame_style || ""} onValueChange={(v) => onChange({ frame_style: v })}>
          <SelectTrigger id="frame_style">
            <SelectValue placeholder="Seleccionar estilo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aviador">Aviador</SelectItem>
            <SelectItem value="rectangular">Rectangular</SelectItem>
            <SelectItem value="redondo">Redondo</SelectItem>
            <SelectItem value="cat-eye">Cat Eye</SelectItem>
            <SelectItem value="wayfarer">Wayfarer</SelectItem>
            <SelectItem value="deportivo">Deportivo</SelectItem>
            <SelectItem value="oversize">Oversize</SelectItem>
            <SelectItem value="sin-montura">Sin Montura</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frame_size">Tamaño del Marco</Label>
        <Select value={formData.frame_size || ""} onValueChange={(v) => onChange({ frame_size: v })}>
          <SelectTrigger id="frame_size">
            <SelectValue placeholder="Seleccionar tamaño" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="XS">XS - Extra Pequeño</SelectItem>
            <SelectItem value="S">S - Pequeño</SelectItem>
            <SelectItem value="M">M - Mediano</SelectItem>
            <SelectItem value="L">L - Grande</SelectItem>
            <SelectItem value="XL">XL - Extra Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lens_color">Color del Lente</Label>
        <Input
          id="lens_color"
          value={formData.lens_color}
          onChange={(e) => onChange({ lens_color: e.target.value })}
          placeholder="Ej: Transparente, Gris, Marrón"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frame_color">Color del Marco</Label>
        <Input
          id="frame_color"
          value={formData.frame_color}
          onChange={(e) => onChange({ frame_color: e.target.value })}
          placeholder="Ej: Negro, Dorado, Azul"
        />
      </div>
    </div>
  </div>
);
