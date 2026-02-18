// src/components/appointments/AdminAppointmentsList.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminAppointments } from "@/hooks/useAdminAppointments";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentSkeleton } from "./AppointmentSkeleton";
import type { AdminAppointmentsListProps } from "./types";

export default function AdminAppointmentsList({ className, maxItems }: AdminAppointmentsListProps) {
  const {
    appointments,
    loading,
    error,
    pendingCount,
    reload,
    confirmAppointment,
  } = useAdminAppointments({ maxItems });

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={reload}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Lista de Citas
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} pendientes
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <AppointmentSkeleton key={i} />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay citas programadas</h3>
              <p className="text-sm text-muted-foreground">Las nuevas citas aparecerán aquí cuando los clientes las soliciten.</p>
              <Button variant="outline" onClick={reload} className="mt-4">
                Actualizar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} onConfirm={confirmAppointment} />
              ))}

              {appointments.length >= (maxItems || 0) && maxItems && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={reload}>
                    Ver más citas
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
