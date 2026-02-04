import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const OrderPagination: React.FC<{
  page: number;
  totalPages: number;
  ordersLength: number;
  totalCount: number;
  setPage: (p: number) => void;
  isLoading: boolean;
}> = ({ page, totalPages, ordersLength, totalCount, setPage, isLoading }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {ordersLength} de {totalCount} pedidos
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || isLoading}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {page > 3 && (
              <>
                <Button variant={1 === page ? "default" : "outline"} size="sm" onClick={() => setPage(1)} disabled={isLoading}>
                  1
                </Button>
                {page > 4 && <span className="px-2">...</span>}
              </>
            )}

            {Array.from({ length: 5 }, (_, i) => {
              const p = page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)} disabled={isLoading}>
                  {p}
                </Button>
              );
            })}

            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && <span className="px-2">...</span>}
                <Button
                  variant={totalPages === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={isLoading}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderPagination;
