import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import type { OpticalProduct } from "@/types";

interface ProductActionsProps {
  product: OpticalProduct;
  onEdit: (p: OpticalProduct) => void;
  onDelete: (id: string) => void;
  onViewImages?: (p: OpticalProduct) => void;
}

export const ProductActions: React.FC<ProductActionsProps> = ({ product, onEdit, onDelete, onViewImages }) => (
  <div className="flex justify-end gap-2">
    {onViewImages && (
      <Button variant="outline" size="sm" onClick={() => onViewImages(product)} title="Ver imágenes">
        <Eye className="w-4 h-4" />
      </Button>
    )}
    <Button variant="outline" size="sm" onClick={() => onEdit(product)} title="Editar producto">
      <Edit className="w-4 h-4" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDelete(product.id)}
      title="Eliminar producto"
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);
