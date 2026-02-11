import { useEffect, lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { SplashScreen } from "@/components/common/SplashScreen";
import AuthRequired from "./components/auth/AuthRequired";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Performance monitoring - lazy load solo en desarrollo
const WebVitalsDebugger = lazy(() => import("@/components/common/WebVitalsDebugger"));
const PWAInstallPrompt = lazy(() => import("@/components/common/PWAInstallPrompt"));

// Página principal - carga eager para LCP
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Health = lazy(() => import("./pages/Health"));
const Login = lazy(() => import("./pages/Login"));

// Páginas que requieren autenticación - carga bajo demanda
const Profile = lazy(() => import("./pages/Profile"));
const Citas = lazy(() => import("./pages/Citas"));
const MisCitas = lazy(() => import("./pages/MisCitas"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const MisPedidos = lazy(() => import("./pages/MisPedidos"));

// Páginas admin - solo para administradores
const AdminCitas = lazy(() => import("./pages/AdminCitas"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Páginas de categorías de productos
const HombresProducts = lazy(() => import("./pages/HombresProducts"));
const MujerProducts = lazy(() => import("./pages/MujerProducts"));
const KidsProducts = lazy(() => import("./pages/KidsProducts"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

// Páginas legales e informativas
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("auth")) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading skeleton optimizado
const PageLoadingSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-4 animate-pulse">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-96" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  </div>
);

// Componente interno que usa hooks de React Router
const AppRoutes = () => {
  // Initialize Google Analytics dentro del contexto del Router
  useGoogleAnalytics();

  return (
    <Layout>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/health" element={<Health />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas de productos por categoría */}
          <Route path="/hombres" element={<HombresProducts />} />
          <Route path="/mujer" element={<MujerProducts />} />
          <Route path="/ninos" element={<KidsProducts />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />

          {/* Rutas de páginas legales */}
          <Route path="/terminos" element={<TermsOfService />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/envios" element={<ShippingPolicy />} />
          <Route path="/devoluciones" element={<ReturnPolicy />} />

          {/* Rutas que requieren autenticación */}
          <Route
            path="/profile"
            element={
              <AuthRequired>
                <Profile />
              </AuthRequired>
            }
          />
          <Route
            path="/citas"
            element={
              <AuthRequired>
                <Citas />
              </AuthRequired>
            }
          />
          <Route
            path="/mis-citas"
            element={
              <AuthRequired>
                <MisCitas />
              </AuthRequired>
            }
          />
          <Route
            path="/cart"
            element={
              <AuthRequired>
                <Cart />
              </AuthRequired>
            }
          />
          <Route
            path="/checkout"
            element={
              <AuthRequired>
                <Checkout />
              </AuthRequired>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <AuthRequired>
                <OrderConfirmation />
              </AuthRequired>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <AuthRequired>
                <MisPedidos />
              </AuthRequired>
            }
          />

          {/* Rutas de administración */}
          <Route
            path="/admin/citas"
            element={
              <AuthRequired requireAdmin>
                <AdminCitas />
              </AuthRequired>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthRequired requireAdmin>
                <AdminDashboard />
              </AuthRequired>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AuthRequired requireAdmin>
                <AdminDashboard />
              </AuthRequired>
            }
          />

          {/* Página 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Initialize service worker
  useServiceWorker();

  useEffect(() => {
    // Lazy load performance monitoring solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      import("@/lib/performance").then(({ PerformanceMonitor }) => {
        const monitor = PerformanceMonitor.getInstance();
        monitor.measurePageLoad();
        monitor.logBundleSize();
      });
    }
  }, []);

  // Mostrar splash screen mientras carga
  if (showSplash) {
    return <SplashScreen onLoadComplete={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ScrollToTop />
            <AppRoutes />

            {/* Componentes opcionales - lazy load */}
            {process.env.NODE_ENV === "development" && (
              <Suspense fallback={null}>
                <WebVitalsDebugger />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <PWAInstallPrompt />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
