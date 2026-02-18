// src/pages/MisCitas.tsx
import { useState } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { useUser } from "@/hooks/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Phone, Mail, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { appointmentsApi } from "@/services/appointments";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MisCitas() {
  const { appointments, loading, refetch } = useAppointments();
  const { user } = useUser();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setCancellingId(appointmentId);
      await appointmentsApi.cancel(appointmentId);
      toast({
        title: "Cita cancelada",
        description: "Tu cita ha sido cancelada exitosamente.",
      });
      refetch();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Pendiente",
        variant: "secondary" as const,
        icon: <Clock className="h-3 w-3" />,
      },
      confirmed: {
        label: "Confirmada",
        variant: "default" as const,
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      completed: {
        label: "Completada",
        variant: "outline" as const,
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      cancelled: {
        label: "Cancelada",
        variant: "destructive" as const,
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const canCancelAppointment = (appointmentDate: string, status: string) => {
    if (status === "cancelled" || status === "completed") return false;

    const appointmentDateTime = new Date(appointmentDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilAppointment > 24; // Permitir cancelar solo si faltan más de 24 horas
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Citas</h1>
              <p className="text-muted-foreground">Gestiona tus citas de examen visual</p>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Citas</h1>
              <p className="text-muted-foreground">Gestiona tus citas de examen visual</p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No tienes citas programadas. ¡Agenda tu primer examen de vista!</AlertDescription>
          </Alert>

          <div className="text-center">
            <Button onClick={() => (window.location.href = "/citas")}>Agendar Nueva Cita</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Citas</h1>
            <p className="text-muted-foreground">
              Tienes {appointments.length} cita{appointments.length !== 1 ? "s" : ""} programada{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/citas")}>Agendar Nueva Cita</Button>
        </div>

        {/* Lista de citas */}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(new Date(appointment.appointment_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(appointment.appointment_date), "HH:mm", { locale: es })}
                      </div>
                      {appointment.eye_exam_locations && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {appointment.eye_exam_locations.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">{getStatusBadge(appointment.status)}</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información del paciente */}
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Información del paciente</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Nombre:</strong> {appointment.patient_name}
                      </p>
                      {appointment.patient_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{appointment.patient_phone}</span>
                        </div>
                      )}
                      {appointment.patient_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{appointment.patient_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.eye_exam_locations && (
                    <div>
                      <h4 className="font-medium mb-2">Ubicación</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>{appointment.eye_exam_locations.name}</strong>
                        </p>
                        <p>{appointment.eye_exam_locations.address}</p>
                        {appointment.eye_exam_locations.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{appointment.eye_exam_locations.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notas adicionales */}
                {appointment.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notas adicionales</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{appointment.notes}</p>
                  </div>
                )}

                {/* Acciones */}
                {canCancelAppointment(appointment.appointment_date, appointment.status) && (
                  <div className="flex justify-end pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={cancellingId === appointment.id}>
                          {cancellingId === appointment.id ? "Cancelando..." : "Cancelar Cita"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción cancelará tu cita del{" "}
                            {format(new Date(appointment.appointment_date), "d 'de' MMMM 'a las' HH:mm", { locale: es })}. Esta acción no se
                            puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sí, cancelar cita
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Mensaje para citas que no se pueden cancelar */}
                {!canCancelAppointment(appointment.appointment_date, appointment.status) &&
                  appointment.status !== "cancelled" &&
                  appointment.status !== "completed" && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        No puedes cancelar esta cita porque faltan menos de 24 horas. Contacta directamente a la óptica para cambios de
                        último momento.
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
