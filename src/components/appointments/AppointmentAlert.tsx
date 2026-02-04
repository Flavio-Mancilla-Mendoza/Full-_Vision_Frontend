// src/components/appointments/AppointmentAlert.tsx
import { Calendar, Clock, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "@/hooks/useAppointments";

export default function AppointmentAlert() {
  const { nextAppointment, pendingAppointments, loading } = useAppointments();
  const navigate = useNavigate();

  // No mostrar si está cargando o no hay próxima cita
  if (loading || !nextAppointment) return null;

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

  const getDaysUntilAppointment = () => {
    const appointmentDate = new Date(`${nextAppointment.appointment_date}T${nextAppointment.appointment_time}`);
    const today = new Date();
    const diffTime = appointmentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntilAppointment();
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Calendar className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900">
        {isToday ? "¡Tienes una cita hoy!" : isTomorrow ? "Tienes una cita mañana" : `Próxima cita en ${daysUntil} días`}
      </AlertTitle>
      <AlertDescription className="text-blue-800">
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">{formatDate(nextAppointment.appointment_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(nextAppointment.appointment_time)}</span>
            </div>
          </div>

          {nextAppointment.eye_exam_locations && (
            <div className="flex items-start gap-1 text-sm">
              <MapPin className="h-3 w-3 mt-0.5" />
              <span>{nextAppointment.eye_exam_locations.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={() => navigate("/mis-citas")} className="bg-blue-600 hover:bg-blue-700">
              Ver mis citas
            </Button>
            {pendingAppointments.length > 1 && (
              <span className="text-xs text-blue-700">
                +{pendingAppointments.length - 1} cita{pendingAppointments.length > 2 ? "s" : ""} más
              </span>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
