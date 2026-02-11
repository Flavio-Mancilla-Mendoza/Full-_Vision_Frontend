import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, Package, MapPin, Calendar } from "lucide-react";
import { StatCard } from "./StatCard";
import type { DashboardStats } from "@/services/admin/dashboard";

interface StatsGridProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const StatsSkeleton: React.FC = () => (
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
);

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, loading }) => {
  if (loading) return <StatsSkeleton />;
  if (!stats) return null;

  return (
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
  );
};
