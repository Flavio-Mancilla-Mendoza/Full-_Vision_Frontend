import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ProductPagination: React.FC<{
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  isLoading: boolean;
  /** Etiqueta para el conteo, ej. "productos", "usuarios". Default: "registros" */
  itemLabel?: string;
}> = ({ page, totalPages, totalCount, pageSize, setPage, setPageSize, isLoading, itemLabel = "registros" }) => {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center space-x-3">
        <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1 || isLoading}>
          Anterior
        </Button>
        <div className="text-sm">
          Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          <span className="text-muted-foreground ml-2">— {totalCount} {itemLabel}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || isLoading}
        >
          Siguiente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-sm text-muted-foreground">Tamaño:</div>
        <Select
          value={pageSize.toString()}
          onValueChange={(v) => {
            const n = parseInt(v, 10);
            setPageSize(n);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductPagination;
