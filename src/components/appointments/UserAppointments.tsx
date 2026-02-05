// src/components/appointments/UserAppointments.tsx
import { useEffect, useState } from "react";
import { appointmentsApi } from "@/services/appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, MapPin, Phone, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
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

interface Appointment {
  id: string;
  status: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  patient_name: string;
  exam_type: string;
  duration_minutes: number;
  created_at: string;
  eye_exam_locations: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
  } | null;
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertCircle,
    description: "Esperando confirmación",
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: "Cita confirmada",
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    description: "Cita cancelada",
  },
  completed: {
    label: "Completada",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
    description: "Examen realizado",
  },
};

export default function UserAppointments() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentsApi.listUser();
      setAppointments(data as unknown as Appointment[]);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError(err instanceof Error ? err.message : "Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setCancellingId(appointmentId);
      await appointmentsApi.cancel(appointmentId);

      toast({
        title: "Cita cancelada",
        description: "Tu cita ha sido cancelada exitosamente.",
      });

      // Recargar la lista
      await loadAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo cancelar la cita",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const isPastAppointment = (dateStr: string, timeStr: string) => {
    const appointmentDateTime = new Date(`${dateStr}T${timeStr}`);
    return appointmentDateTime < new Date();
  };

  const canCancelAppointment = (appointment: Appointment) => {
    return appointment.status === "pending" && !isPastAppointment(appointment.appointment_date, appointment.appointment_time);
  };

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
            <Button onClick={loadAppointments} variant="outline">
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
          {appointments.map((appointment) => {
            const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isPast = isPastAppointment(appointment.appointment_date, appointment.appointment_time);

            return (
              <Card
                key={appointment.id}
                className={`border-l-4 ${
                  appointment.status === "pending"
                    ? "border-l-yellow-400"
                    : appointment.status === "confirmed"
                    ? "border-l-green-400"
                    : appointment.status === "cancelled"
                    ? "border-l-red-400"
                    : "border-l-blue-400"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Status and Date */}
                      <div className="flex items-center gap-3">
                        <Badge className={`${status.color} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        {isPast && appointment.status !== "completed" && appointment.status !== "cancelled" && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Expirada
                          </Badge>
                        )}
                      </div>

                      {/* Date and Time */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(appointment.appointment_time)}</span>
                          <span className="text-muted-foreground">({appointment.duration_minutes} min)</span>
                        </div>
                      </div>

                      {/* Location */}
                      {appointment.eye_exam_locations && (
                        <div className="flex items-start gap-1 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{appointment.eye_exam_locations.name}</p>
                            {appointment.eye_exam_locations.address && (
                              <p className="text-muted-foreground">{appointment.eye_exam_locations.address}</p>
                            )}
                            {appointment.eye_exam_locations.city && (
                              <p className="text-muted-foreground">{appointment.eye_exam_locations.city}</p>
                            )}
                            {appointment.eye_exam_locations.phone && (
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                <span>{appointment.eye_exam_locations.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Notas:</p>
                          <p className="bg-gray-50 p-2 rounded text-sm">{appointment.notes}</p>
                        </div>
                      )}

                      {/* Exam Type */}
                      <div className="text-sm text-muted-foreground">
                        Tipo de examen: <span className="capitalize">{appointment.exam_type}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4">
                      {canCancelAppointment(appointment) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={cancellingId === appointment.id}>
                              {cancellingId === appointment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres cancelar tu cita del {formatDate(appointment.appointment_date)} a las{" "}
                                {formatTime(appointment.appointment_time)}? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Sí, cancelar cita
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
