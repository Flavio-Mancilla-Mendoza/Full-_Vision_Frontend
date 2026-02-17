import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ProductFormData } from "@/types/product-forms";

interface BasicInfoSectionProps {
  formData: ProductFormData;
  onChange: (data: Partial<ProductFormData>) => void;
  onGenerateSKU: () => void;
  onGenerateSlug: () => void;
  generatingSKU: boolean;
  generatingSlug: boolean;
  generateSlug: (name: string) => string;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  onChange,
  onGenerateSKU,
  onGenerateSlug,
  generatingSKU,
  generatingSlug,
  generateSlug,
}) => (
  <>
    {/* Nombre y SKU */}
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value;
            onChange({ name, slug: formData.slug || generateSlug(name) });
          }}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sku">SKU</Label>
        <div className="flex gap-2">
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="Ej: FV-RABA-AVD-M-A1B"
          />
          <Button type="button" variant="outline" size="sm" onClick={onGenerateSKU} disabled={!formData.name || generatingSKU}>
            {generatingSKU ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          El SKU se genera automáticamente basado en el nombre y características del producto
        </p>
      </div>
    </div>

    {/* Descripción */}
    <div className="grid gap-2">
      <Label htmlFor="description">Descripción</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
      />
    </div>

    {/* Slug */}
    <div className="grid gap-2">
      <Label htmlFor="slug">Slug (URL)</Label>
      <div className="flex gap-2">
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="se-genera-automaticamente"
        />
        <Button type="button" variant="outline" size="sm" onClick={onGenerateSlug} disabled={!formData.name || generatingSlug}>
          {generatingSlug ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generando...
            </>
          ) : (
            "Generar"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        El slug se usa para la URL del producto: /productos/{formData.slug || "slug-del-producto"}
      </p>
    </div>
  </>
);
