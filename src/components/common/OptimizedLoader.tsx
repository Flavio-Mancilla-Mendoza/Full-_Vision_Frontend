import { ReactNode, useMemo } from "react";
import { useUser } from "@/hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedLoaderProps {
  children: ReactNode;
  adminOnly?: boolean;
  authenticatedOnly?: boolean;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

const DefaultLoading = () => (
  <div className="container mx-auto px-4 py-8 space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-96" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  </div>
);

const OptimizedLoader = ({ children, adminOnly = false, authenticatedOnly = false, fallback, loadingComponent }: OptimizedLoaderProps) => {
  const { user, loading, isAuthenticated } = useUser();

  const shouldRender = useMemo(() => {
    if (loading) return false;

    if (adminOnly && user?.role !== "admin") return false;
    if (authenticatedOnly && !isAuthenticated) return false;

    return true;
  }, [loading, adminOnly, authenticatedOnly, user?.role, isAuthenticated]);

  if (loading) {
    return loadingComponent || <DefaultLoading />;
  }

  if (!shouldRender) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default OptimizedLoader;
