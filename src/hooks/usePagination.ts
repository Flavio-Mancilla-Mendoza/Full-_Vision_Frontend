import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

export type PagedResult<T> = {
  data: T[];
  count: number;
  totalPages: number;
};

export function usePagination<T, TFilters = Record<string, unknown>>(options: {
  key: string | Array<unknown>;
  fetcher: (page: number, pageSize: number, filters?: TFilters) => Promise<PagedResult<T>>;
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: TFilters;
  enabled?: boolean;
  staleTime?: number;
}) {
  const { key, fetcher, initialPage = 1, initialPageSize = 50, initialFilters = {} as TFilters, enabled = true, staleTime } = options;

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const queryKey = Array.isArray(key) ? [...key, page, pageSize, filters] : [key, page, pageSize, filters];

  const query = useQuery<PagedResult<T>>({
    queryKey,
    queryFn: () => fetcher(page, pageSize, filters),
    enabled,
    staleTime,
    refetchOnWindowFocus: false,
  });

  // Keep a stable ref to query.refetch to avoid infinite re-renders
  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;
  const refresh = useCallback(() => refetchRef.current(), []);

  const result = query.data as PagedResult<T> | undefined;
  const emptyArray = useMemo(() => [] as T[], []);

  return {
    data: result?.data ?? emptyArray,
    total: result?.count ?? 0,
    totalPages: result?.totalPages ?? 1,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refresh,
  };
}
