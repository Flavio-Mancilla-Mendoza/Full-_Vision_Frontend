// src/components/appointments/AdminAppointmentsList.tsx
import { useEffect, useState, useCallback } from "react";
import { listAppointmentsAll, confirmAppointment } from "@/services/appointments";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, User, MapPin, FileText, CheckCircle, Clock, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CalendarAppointment, AppointmentStatus } from "@/types/appointments";

// Interfaz extendida para admin con campos adicionales de Supabase
interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  scheduled_at?: string;
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  notes?: string | null;
  location_id?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  eye_exam_locations?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
  } | null;
  profiles?: Array<{
    full_name: string;
    email?: string;
    phone?: string;
  }>;
}

interface AdminAppointmentsListProps {
  className?: string;
  maxItems?: number;
}

const AppointmentSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
    </CardContent>
  </Card>
);

const AppointmentCard = ({ appointment, onConfirm }: { appointment: Appointment; onConfirm: (id: string) => void }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(appointment.id);
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      requested: { variant: "secondary" as const, icon: Clock, label: "Pendiente" },
      pending: { variant: "secondary" as const, icon: Clock, label: "Pendiente" },
      confirmed: { variant: "default" as const, icon: CheckCircle, label: "Confirmada" },
      completed: { variant: "outline" as const, icon: CheckCircle, label: "Completada" },
      cancelled: { variant: "destructive" as const, icon: AlertCircle, label: "Cancelada" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.requested;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (appointment: Appointment) => {
    try {
      let dateToFormat: Date;

      if (appointment.scheduled_at) {
        dateToFormat = new Date(appointment.scheduled_at);
      } else if (appointment.appointment_date && appointment.appointment_time) {
        const dateTimeString = `${appointment.appointment_date}T${appointment.appointment_time}`;
        dateToFormat = new Date(dateTimeString);
      } else {
        return "Fecha no disponible";
      }

      return dateToFormat.toLocaleString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const clientName = appointment.patient_name || appointment.profiles?.[0]?.full_name || "Cliente sin nombre";
  const clientEmail = appointment.patient_email || appointment.profiles?.[0]?.email;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            {/* Location */}
            {(() => {
              // Función helper para obtener la ubicación independientemente del formato
              const getLocation = () => {
                if (!appointment.eye_exam_locations) return null;
                // Si es array, tomar el primer elemento
                if (Array.isArray(appointment.eye_exam_locations)) {
                  return appointment.eye_exam_locations[0] || null;
                }
                // Si es objeto directo
                return appointment.eye_exam_locations;
              };

              const location = getLocation();

              return location ? (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{location.name}</p>
                    {location.address && <p className="text-sm text-muted-foreground">{location.address}</p>}
                    {location.city && <p className="text-sm text-muted-foreground">{location.city}</p>}
                    {location.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-sm">{location.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-500">⚠️ Sin ubicación asignada</p>
                    <p className="text-xs text-red-400">La cita no tiene location_id o la ubicación fue eliminada</p>
                    <pre className="text-xs bg-gray-100 p-1 mt-1 rounded">{JSON.stringify(appointment.eye_exam_locations, null, 2)}</pre>
                  </div>
                </div>
              );
            })()}

            {/* Date and Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{formatDate(appointment)}</span>
              </div>
              {getStatusBadge(appointment.status)}
            </div>

            {/* Client */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Cliente: <span className="font-medium">{clientName}</span>
                {clientEmail && <span className="text-muted-foreground"> ({clientEmail})</span>}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium">Notas:</span> {appointment.notes}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {appointment.status === "scheduled" && (
            <Button onClick={handleConfirm} disabled={isConfirming} size="sm" className="shrink-0">
              {isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminAppointmentsList({ className, maxItems }: AdminAppointmentsListProps) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listAppointmentsAll();

      if (!Array.isArray(data)) {
        throw new Error("Formato de datos inválido");
      }

      // Filter and sort appointments
      const sortedAppointments = data
        .slice(0, maxItems) // Limit items if specified
        .sort((a, b) => {
          // Priority: scheduled first, then by date
          const aIsPending = a.status === "scheduled";
          const bIsPending = b.status === "scheduled";

          if (aIsPending && !bIsPending) return -1;
          if (bIsPending && !aIsPending) return 1;

          // Sort by date
          const getDate = (apt: Appointment) => {
            if (apt.scheduled_at) return apt.scheduled_at;
            if (apt.appointment_date && apt.appointment_time) {
              return `${apt.appointment_date}T${apt.appointment_time}`;
            }
            return "";
          };

          const aDate = getDate(a);
          const bDate = getDate(b);

          return new Date(aDate).getTime() - new Date(bDate).getTime();
        });

      setAppointments(sortedAppointments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar las citas";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [maxItems, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleConfirmAppointment = async (id: string) => {
    try {
      await confirmAppointment(id);
      toast({
        title: "Éxito",
        description: "Cita confirmada correctamente",
        variant: "default",
      });
      await loadAppointments(); // Reload data
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al confirmar la cita";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={loadAppointments}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pendingCount = appointments.filter((apt) => apt.status === "scheduled").length;

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
              <Button variant="outline" onClick={loadAppointments} className="mt-4">
                Actualizar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} onConfirm={handleConfirmAppointment} />
              ))}

              {appointments.length >= (maxItems || 0) && maxItems && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadAppointments}>
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
