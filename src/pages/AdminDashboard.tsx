import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  MapPin,
  Calendar,
  TrendingUp,
  Activity,
  Plus,
  UserPlus,
  PackagePlus,
  MapPinPlus,
  LogOut,
  Star,
  ShoppingBag,
} from "lucide-react";
import { getDashboardStats } from "@/services/admin";
import type { DashboardStats } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { AdminOnly } from "@/components/auth/AuthGate";

// Modern performance logger usando Performance Observer API
const logPerformance = () => {
  if (typeof window !== "undefined" && "PerformanceObserver" in window) {
    let fcpLogged = false;
    let lcpLogged = false;

    // Observer para paint metrics
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === "first-contentful-paint" && !fcpLogged) {
            // FCP logging removed for production
            fcpLogged = true;
          }
        });
      });
      paintObserver.observe({ entryTypes: ["paint"] });

      // Observer para LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && !lcpLogged) {
          // LCP logging removed for production
          lcpLogged = true;
          lcpObserver.disconnect();
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // Cleanup después de 5 segundos
      setTimeout(() => {
        paintObserver.disconnect();
        lcpObserver.disconnect();
      }, 5000);
    } catch (error) {
      // Fallback para navegadores que no soportan Performance Observer
      // Performance logging removed for production
      setTimeout(() => {
        const paintEntries = performance.getEntriesByType("paint");
        const lcpEntries = performance.getEntriesByType("largest-contentful-paint");

        // Performance metrics captured but not logged to reduce console spam
      }, 2000);
    }
  }
};

// Lazy load de componentes pesados
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then((module) => ({ default: module.UserManagement })));
const ProductManagement = lazy(() =>
  import("@/components/admin/ProductManagement").then((module) => ({ default: module.ProductManagement }))
);
const LocationManagement = lazy(() =>
  import("@/components/admin/LocationManagement").then((module) => ({ default: module.LocationManagement }))
);
const FeaturedProductsManagement = lazy(() =>
  import("@/components/admin/FeaturedProductsManagement").then((module) => ({ default: module.FeaturedProductsManagement }))
);
const SiteContentManagement = lazy(() => import("@/components/admin/SiteContentManager").then((module) => ({ default: module.default })));
const AttributeManagement = lazy(() => import("@/components/admin/AttributeManagement").then((module) => ({ default: module.default })));
const OrderManagement = lazy(() => import("@/components/admin/OrderManagement").then((module) => ({ default: module.OrderManagement })));

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {trend && (
        <div className="flex items-center pt-1">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-xs text-green-500">
            +{trend.value} {trend.label}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import("@/services/cognito-auth");
      const result = await logoutUser();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });

      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  // Solo cargar estadísticas cuando se esté en la pestaña overview
  useEffect(() => {
    if (activeTab === "overview" && !stats) {
      loadStats();
    }
  }, [activeTab, stats, loadStats]);

  // Log performance metrics
  useEffect(() => {
    logPerformance();
  }, []);

  // Componente de Loading para Suspense
  const TabLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Cargando...</p>
      </div>
    </div>
  );

  return (
    <AdminOnly>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Gestiona usuarios, productos, ubicaciones y citas desde aquí</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              Administrador
            </Badge>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="featured">Destacados</TabsTrigger>
            <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="attributes">Atributos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            {statsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Usuarios"
                  value={stats.totalUsers}
                  description={`${stats.activeUsers} activos`}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  title="Productos"
                  value={stats.totalProducts}
                  description="En catálogo"
                  icon={<Package className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  title="Ubicaciones"
                  value={stats.totalLocations}
                  description="Centros disponibles"
                  icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  title="Citas"
                  value={stats.totalAppointments}
                  description="Total registradas"
                  icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                  trend={{
                    value: stats.recentAppointments,
                    label: "últimos 7 días",
                  }}
                />
              </div>
            ) : null}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Acceso directo a las operaciones más comunes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" onClick={() => setActiveTab("users")}>
                    <UserPlus className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Nuevo Usuario</div>
                      <div className="text-sm text-muted-foreground">Crear cuenta de usuario</div>
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" onClick={() => setActiveTab("products")}>
                    <PackagePlus className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Nuevo Producto</div>
                      <div className="text-sm text-muted-foreground">Añadir al catálogo</div>
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" onClick={() => setActiveTab("featured")}>
                    <Star className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Productos Destacados</div>
                      <div className="text-sm text-muted-foreground">Gestionar homepage</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => setActiveTab("locations")}
                  >
                    <MapPinPlus className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-medium">Nueva Ubicación</div>
                      <div className="text-sm text-muted-foreground">Configurar centro</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas operaciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sistema iniciado correctamente</p>
                      <p className="text-xs text-muted-foreground">Dashboard administrativo activo</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Ahora</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Estadísticas actualizadas</p>
                      <p className="text-xs text-muted-foreground">Datos sincronizados con la base de datos</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 min</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Módulos CRUD disponibles</p>
                      <p className="text-xs text-muted-foreground">Gestión completa de usuarios, productos y ubicaciones</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Suspense fallback={<TabLoading />}>
              <OrderManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="users">
            <Suspense fallback={<TabLoading />}>
              <UserManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="products">
            <Suspense fallback={<TabLoading />}>
              <ProductManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="featured">
            <Suspense fallback={<TabLoading />}>
              <FeaturedProductsManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="locations">
            <Suspense fallback={<TabLoading />}>
              <LocationManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="content">
            <Suspense fallback={<TabLoading />}>
              <SiteContentManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="attributes">
            <Suspense fallback={<TabLoading />}>
              <AttributeManagement />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnly>
  );
};

export default AdminDashboard;
