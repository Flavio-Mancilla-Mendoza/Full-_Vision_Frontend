// src/components/appointments/UserAppointments.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { useUserAppointments } from "@/hooks/useUserAppointments";
import { UserAppointmentCard } from "./UserAppointmentCard";

export default function UserAppointments() {
  const {
    appointments,
    loading,
    error,
    cancellingId,
    reload,
    cancelAppointment,
  } = useUserAppointments();

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando tus citas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium">Error al cargar las citas</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button onClick={reload} variant="outline">
              Intentar nuevamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mis Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes citas programadas</p>
              <p className="text-sm">¡Agenda tu examen de vista hoy!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mis Citas ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <UserAppointmentCard
              key={appointment.id}
              appointment={appointment}
              cancellingId={cancellingId}
              onCancel={cancelAppointment}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
