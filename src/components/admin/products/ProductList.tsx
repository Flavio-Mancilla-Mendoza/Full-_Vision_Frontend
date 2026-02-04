import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductRow } from "./ProductRow";
import type { OpticalProduct } from "@/types";

interface ProductListProps {
  products: OpticalProduct[];
  onEdit: (p: OpticalProduct) => void;
  onDelete: (id: string) => void;
  onViewImages?: (p: OpticalProduct) => Promise<void> | void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete, onViewImages }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Actualizado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <ProductRow key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} onViewImages={onViewImages} />
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductList;
