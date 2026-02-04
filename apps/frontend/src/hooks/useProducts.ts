import { useCallback } from "react";
import { usePagination } from "@/hooks/usePagination";
import { getAllOpticalProductsPaginated, createOpticalProduct, updateOpticalProduct, deleteOpticalProduct } from "@/services/admin";
import type { OpticalProduct } from "@/types";

export function useProducts(initialPage = 1, initialPageSize = 50) {
  const pagination = usePagination<OpticalProduct>({
    key: ["products"],
    fetcher: getAllOpticalProductsPaginated,
    initialPage,
    initialPageSize,
    initialFilters: {},
  });

  const refresh = useCallback(() => pagination.refresh(), [pagination]);

  const createProduct = useCallback(
    async (data: Partial<OpticalProduct>) => {
      const created = await createOpticalProduct(data as Parameters<typeof createOpticalProduct>[0]);
      await refresh();
      return created as OpticalProduct;
    },
    [refresh]
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<OpticalProduct>) => {
      const updated = await updateOpticalProduct(id, data as Parameters<typeof updateOpticalProduct>[1]);
      await refresh();
      return updated as OpticalProduct;
    },
    [refresh]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const res = await deleteOpticalProduct(id);
      await refresh();
      return res;
    },
    [refresh]
  );

  return {
    ...pagination,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

export default useProducts;
