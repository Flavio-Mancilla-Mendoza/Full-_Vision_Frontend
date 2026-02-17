import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ProductFormData } from "@/types/product-forms";

interface PricingStockSectionProps {
  formData: ProductFormData;
  onChange: (data: Partial<ProductFormData>) => void;
}

const formatPEN = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

export const PricingStockSection: React.FC<PricingStockSectionProps> = ({ formData, onChange }) => {
  const discount = formData.discount_percentage ?? 0;
  const salePrice = discount > 0
    ? formData.base_price * (1 - discount / 100)
    : formData.base_price;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="base_price">Precio Base (S/)</Label>
          <Input
            id="base_price"
            type="text"
            placeholder="Ej: 100.00"
            value={formData.base_price > 0 ? formData.base_price.toString() : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                onChange({ base_price: parseFloat(value) || 0 });
              }
            }}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="discount_percentage">Descuento (%)</Label>
          <Input
            id="discount_percentage"
            type="text"
            placeholder="Ej: 15"
            value={discount > 0 ? discount.toString() : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100)) {
                onChange({ discount_percentage: parseFloat(value) || 0 });
              }
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label>Precio de Venta</Label>
          <div className="flex items-center h-10 px-3 bg-muted rounded-md">
            <span className="text-sm font-semibold">{formatPEN(salePrice)}</span>
          </div>
        </div>
      </div>

      {discount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {discount}% OFF
            </Badge>
            <span className="text-sm text-muted-foreground">
              Ahorro: {formatPEN(formData.base_price * (discount / 100))}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="stock_quantity">Stock</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => onChange({ stock_quantity: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="min_stock_level">Nivel Mínimo de Stock</Label>
          <Input
            id="min_stock_level"
            type="number"
            min="0"
            value={formData.min_stock_level}
            onChange={(e) => onChange({ min_stock_level: parseInt(e.target.value) || 5 })}
          />
        </div>
      </div>
    </div>
  );
};
