import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { getDashboardStats } from "@/services/admin";
import type { DashboardStats } from "@/services/admin";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "@/components/auth/AuthGate";
import { StatsGrid, QuickActions, TabLoading } from "@/components/admin/dashboard";

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
            <StatsGrid stats={stats} loading={statsLoading} />
            <QuickActions onNavigateTab={setActiveTab} />
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
