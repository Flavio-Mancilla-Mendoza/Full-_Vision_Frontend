/**
 * ProductFeatures - Badges de características del producto
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ProductFeaturesProps {
  has_uv_protection?: boolean | null;
  has_blue_filter?: boolean | null;
  is_photochromic?: boolean | null;
  has_anti_reflective?: boolean | null;
}

const features: { key: keyof ProductFeaturesProps; label: string }[] = [
  { key: "has_uv_protection", label: "Protección UV" },
  { key: "has_blue_filter", label: "Filtro Azul" },
  { key: "is_photochromic", label: "Fotocromático" },
  { key: "has_anti_reflective", label: "Antirreflejo" },
];

const ProductFeatures: React.FC<ProductFeaturesProps> = (props) => {
  const activeFeatures = features.filter((f) => props[f.key]);

  if (activeFeatures.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFeatures.map((feature) => (
        <Badge key={feature.key} variant="outline" className="gap-1">
          <Check className="h-3 w-3" /> {feature.label}
        </Badge>
      ))}
    </div>
  );
};

export default ProductFeatures;
