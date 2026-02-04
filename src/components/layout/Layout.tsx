import { ReactNode, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface LayoutProps {
  children?: ReactNode;
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-4 animate-pulse">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-96" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  </div>
);

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Páginas que no necesitan navbar/footer (ej: login, admin)
  const isAuthPage = location.pathname === "/login";
  const isAdminPage = location.pathname.startsWith("/admin");

  if (isAuthPage) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<PageSkeleton />}>{children || <Outlet />}</Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  if (isAdminPage) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Panel de Administración - Full Vision</h1>
              <nav className="flex gap-4">
                <a href="/admin/citas" className="text-blue-600 hover:text-blue-700">
                  Citas
                </a>
                <a href="/" className="text-gray-600 hover:text-gray-700">
                  Volver al sitio
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <Suspense fallback={<PageSkeleton />}>{children || <Outlet />}</Suspense>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  // Layout principal con navbar y footer
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageSkeleton />}>{children || <Outlet />}</Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
