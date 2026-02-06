import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Image as ImageIcon } from "lucide-react";
import type { OpticalProduct } from "@/types";

export const ProductRow: React.FC<{
  product: OpticalProduct;
  onEdit: (p: OpticalProduct) => void;
  onDelete: (id: string) => void;
  onViewImages?: (p: OpticalProduct) => Promise<void> | void;
}> = ({ product, onEdit, onDelete, onViewImages }) => {
  const price = product.sale_price ?? product.base_price;

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name || "-"}</TableCell>
      <TableCell>{product.sku || "-"}</TableCell>
      <TableCell>{typeof price === "number" ? price.toFixed(2) : "-"}</TableCell>
      <TableCell>{product.discount_percentage ? `${product.discount_percentage}%` : "-"}</TableCell>
      <TableCell>{product.stock_quantity ?? "-"}</TableCell>
      <TableCell>
        <Badge variant={product.is_active ? "default" : "destructive"}>
          {product.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>
      <TableCell>{product.updated_at ? new Date(product.updated_at).toLocaleDateString() : "-"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {onViewImages && (
            <Button variant="outline" size="sm" onClick={() => onViewImages(product)}>
              <ImageIcon className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(product.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProductRow;
