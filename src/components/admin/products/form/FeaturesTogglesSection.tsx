import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BrandSelector from "@/components/admin/products/BrandSelector";
import type { ProductFormData } from "@/types/product-forms";

interface FeaturesTogglesSectionProps {
  formData: ProductFormData;
  onChange: (data: Partial<ProductFormData>) => void;
}

export const FeaturesTogglesSection: React.FC<FeaturesTogglesSectionProps> = ({ formData, onChange }) => (
  <>
    {/* Marca */}
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Marca</h3>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="brand">Marca del Producto</Label>
          <BrandSelector
            value={formData.brand_id as string | undefined}
            onChange={(v) => onChange({ brand_id: v })}
          />
        </div>
      </div>
    </div>

    {/* Género y características especiales */}
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Características Especiales</h3>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="gender">Género</Label>
          <Select value={formData.gender} onValueChange={(value) => onChange({ gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unisex">Unisex</SelectItem>
              <SelectItem value="hombre">Hombre</SelectItem>
              <SelectItem value="mujer">Mujer</SelectItem>
              <SelectItem value="niño">Niño</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="has_uv_protection" checked={formData.has_uv_protection} onCheckedChange={(checked) => onChange({ has_uv_protection: checked })} />
            <Label htmlFor="has_uv_protection">Protección UV</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="has_blue_filter" checked={formData.has_blue_filter} onCheckedChange={(checked) => onChange({ has_blue_filter: checked })} />
            <Label htmlFor="has_blue_filter">Filtro de Luz Azul</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="is_photochromic" checked={formData.is_photochromic} onCheckedChange={(checked) => onChange({ is_photochromic: checked })} />
            <Label htmlFor="is_photochromic">Fotocromático</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="has_anti_reflective" checked={formData.has_anti_reflective} onCheckedChange={(checked) => onChange({ has_anti_reflective: checked })} />
            <Label htmlFor="has_anti_reflective">Anti-reflejo</Label>
          </div>
        </div>
      </div>
    </div>

    {/* Destacados */}
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Configuración de Destacados</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => onChange({ is_featured: checked })} />
          <Label htmlFor="is_featured">Producto Destacado</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="is_bestseller" checked={formData.is_bestseller} onCheckedChange={(checked) => onChange({ is_bestseller: checked })} />
          <Label htmlFor="is_bestseller">Más Vendido</Label>
        </div>
      </div>
    </div>
  </>
);
