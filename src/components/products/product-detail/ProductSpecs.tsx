/**
 * ProductSpecs - Grid de especificaciones técnicas del producto
 */

import React from "react";

interface ProductSpecsProps {
  frame_material?: string | null;
  frame_style?: string | null;
  frame_size?: string | null;
  frame_color?: string | null;
  lens_color?: string | null;
  bridge_width?: number | null;
  temple_length?: number | null;
  lens_width?: number | null;
}

const specs: { key: keyof ProductSpecsProps; label: string; suffix?: string; transform?: "capitalize" | "uppercase" }[] = [
  { key: "frame_material", label: "Material", transform: "capitalize" },
  { key: "frame_style", label: "Estilo", transform: "capitalize" },
  { key: "frame_size", label: "Talla", transform: "uppercase" },
  { key: "frame_color", label: "Color", transform: "capitalize" },
  { key: "lens_color", label: "Color lente", transform: "capitalize" },
  { key: "bridge_width", label: "Puente", suffix: "mm" },
  { key: "temple_length", label: "Patilla", suffix: "mm" },
  { key: "lens_width", label: "Lente", suffix: "mm" },
];

const ProductSpecs: React.FC<ProductSpecsProps> = (props) => {
  const visibleSpecs = specs.filter((s) => props[s.key] != null);

  if (visibleSpecs.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {visibleSpecs.map((spec) => {
        const value = props[spec.key];
        let display = String(value);
        if (spec.transform === "capitalize") {
          display = display.charAt(0).toUpperCase() + display.slice(1).toLowerCase();
        } else if (spec.transform === "uppercase") {
          display = display.toUpperCase();
        }
        if (spec.suffix) display += spec.suffix;

        return (
          <div key={spec.key}>
            <span className="text-muted-foreground">{spec.label}</span>
            <p className="font-medium">{display}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ProductSpecs;
