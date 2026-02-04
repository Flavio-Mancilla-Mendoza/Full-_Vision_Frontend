// src/components/appointments/AppointmentStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointmentStats } from "@/hooks/useAppointmentStats";
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, XCircle, TrendingUp, Users, LucideIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = "default",
  className = "",
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}) => {
  const variantClasses = {
    default: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-green-200 bg-green-50 text-green-900",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
    destructive: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <Card className={`${variantClasses[variant]} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="w-8 h-8 opacity-75" />
        </div>
      </CardContent>
    </Card>
  );
};

const LocationCard = ({
  locationName,
  count,
  pending,
  confirmed,
  completed,
  cancelled,
}: {
  locationName: string;
  count: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium">{locationName}</h4>
        </div>
        <Badge variant="secondary">{count} total</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {pending > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-600" />
            <span className="text-yellow-600">{pending} pendientes</span>
          </div>
        )}
        {confirmed > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-green-600">{confirmed} confirmadas</span>
          </div>
        )}
        {completed > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600">{completed} completadas</span>
          </div>
        )}
        {cancelled > 0 && (
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span className="text-red-600">{cancelled} canceladas</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function AppointmentStats() {
  const { stats, loading, error, refresh } = useAppointmentStats();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={refresh}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Estadísticas generales - Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estadísticas por tiempo - Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ubicaciones - Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Skeleton key={j} className="h-4 w-20" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de citas" value={stats.totalAppointments} icon={Users} variant="default" />
        <StatCard title="Pendientes" value={stats.pendingAppointments} icon={Clock} variant="warning" />
        <StatCard title="Confirmadas" value={stats.confirmedAppointments} icon={CheckCircle} variant="success" />
        <StatCard title="Completadas" value={stats.completedAppointments} icon={CheckCircle} variant="default" />
      </div>

      {/* Estadísticas por tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Citas por período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</p>
              <p className="text-sm text-muted-foreground">Hoy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.weekAppointments}</p>
              <p className="text-sm text-muted-foreground">Esta semana</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.monthAppointments}</p>
              <p className="text-sm text-muted-foreground">Este mes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas por ubicación */}
      {stats.locationStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Citas por ubicación
              <Badge variant="secondary" className="ml-2">
                {stats.locationStats.length} ubicaciones
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.locationStats.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Sin datos por ubicación</h3>
                <p className="text-sm text-muted-foreground">Las estadísticas por ubicación aparecerán cuando haya citas programadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.locationStats.map((location) => (
                  <LocationCard
                    key={location.locationId}
                    locationName={location.locationName}
                    count={location.count}
                    pending={location.pending}
                    confirmed={location.confirmed}
                    completed={location.completed}
                    cancelled={location.cancelled}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen rápido */}
      {stats.totalAppointments === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay citas registradas</h3>
              <p className="text-sm text-muted-foreground">Las estadísticas aparecerán cuando los clientes comiencen a programar citas.</p>
              <Button variant="outline" onClick={refresh} className="mt-4">
                Actualizar estadísticas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
