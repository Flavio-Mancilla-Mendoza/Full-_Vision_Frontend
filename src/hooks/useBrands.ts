import { useState, useEffect, useCallback } from "react";
import { getAllBrands, type Brand } from "@/services/brands";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook para cargar y mantener la lista de marcas.
 */
export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { toast } = useToast();

  const loadBrands = useCallback(async () => {
    try {
      const fetched = await getAllBrands();
      setBrands(fetched);
    } catch (error) {
      console.error("Error loading brands:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las marcas",
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  return { brands, setBrands, refreshBrands: loadBrands };
}
