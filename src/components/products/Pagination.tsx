/**
 * Componente de Paginación
 * Maneja la navegación entre páginas con lógica de visualización inteligente
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasMore,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Anterior
      </Button>

      {[...Array(totalPages)].map((_, i) => {
        const page = i + 1;
        // Mostrar solo páginas cercanas a la actual
        if (
          page === 1 ||
          page === totalPages ||
          (page >= currentPage - 2 && page <= currentPage + 2)
        ) {
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          );
        } else if (page === currentPage - 3 || page === currentPage + 3) {
          return <span key={page} className="px-2">...</span>;
        }
        return null;
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};
