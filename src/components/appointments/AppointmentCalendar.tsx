// src/components/appointments/AppointmentCalendar.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, Event, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { appointmentsApi } from "@/services/appointments";
import { getAllLocations } from "@/services/admin";
import { Calendar as CalendarIcon, MapPin, User, Clock, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CalendarAppointment } from "@/types/appointments";
import type { Location } from "@/types/location";

// Configurar moment en español
moment.locale("es");
const localizer = momentLocalizer(moment);

interface AppointmentEvent extends Event {
  resource: {
    id: string;
    status: string;
    location: string;
    locationId: string;
    clientName: string;
    clientEmail?: string;
    notes?: string;
  };
}

const statusColors = {
  requested: "#f59e0b", // amber
  pending: "#f59e0b", // amber
  confirmed: "#10b981", // emerald
  completed: "#6b7280", // gray
  cancelled: "#ef4444", // red
};

const statusLabels = {
  requested: "Pendiente",
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function AppointmentCalendar() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  // Cargar ubicaciones desde la base de datos
  const loadLocations = useCallback(async () => {
    try {
      const locations = await getAllLocations();
      setAllLocations(locations.filter((loc) => loc.is_active)); // Solo ubicaciones activas
    } catch (error) {
      console.error("Error loading locations:", error);
      // Si falla, intentar obtener ubicaciones de las citas como fallback
      toast({
        title: "Advertencia",
        description: "No se pudieron cargar todas las ubicaciones. Se mostrarán solo las que tienen citas.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Cargar citas
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await appointmentsApi.listAll();
      setAppointments(data || []);
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
  }, [toast]);

  useEffect(() => {
    // Cargar datos iniciales en paralelo
    const loadInitialData = async () => {
      await Promise.all([loadAppointments(), loadLocations()]);
    };

    loadInitialData();
  }, [loadAppointments, loadLocations]);

  // Convertir citas a eventos del calendario
  const events: AppointmentEvent[] = useMemo(() => {
    if (!appointments) return [];

    return appointments
      .filter((apt) => {
        // Filtrar por ubicación
        if (selectedLocation !== "all") {
          const locationMatch = apt.eye_exam_locations?.id === selectedLocation;
          if (!locationMatch) return false;
        }

        // Filtrar por estado
        if (selectedStatus !== "all") {
          if (apt.status !== selectedStatus) return false;
        }

        return true;
      })
      .map((apt) => {
        // Crear fecha y hora del evento
        let eventDate: Date;

        // CalendarAppointment usa appointment_date y appointment_time
        if (apt.appointment_date && apt.appointment_time) {
          const dateTimeString = `${apt.appointment_date}T${apt.appointment_time}`;
          eventDate = new Date(dateTimeString);
        } else {
          // Fallback: usar fecha actual
          eventDate = new Date();
        }

        // Duración por defecto de 1 hora
        const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);

        const locationName = apt.eye_exam_locations?.name || "Sin ubicación";
        const clientName = apt.patient_name || "Cliente sin nombre";
        const clientEmail = apt.patient_email;

        return {
          id: apt.id,
          title: `${clientName} - ${locationName}`,
          start: eventDate,
          end: endDate,
          resource: {
            id: apt.id,
            status: apt.status,
            location: locationName,
            locationId: apt.eye_exam_locations?.id || "",
            clientName,
            clientEmail,
            notes: apt.notes,
          },
        };
      });
  }, [appointments, selectedLocation, selectedStatus]);

  // Configuración de estilos para eventos
  const eventStyleGetter = useCallback((event: AppointmentEvent) => {
    const status = event.resource.status;
    const backgroundColor = statusColors[status as keyof typeof statusColors] || "#6b7280";

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
        padding: "2px 4px",
      },
    };
  }, []);

  // Manejar selección de evento
  const handleSelectEvent = useCallback(
    (event: AppointmentEvent) => {
      const { resource } = event;
      const statusLabel = statusLabels[resource.status as keyof typeof statusLabels] || resource.status;

      toast({
        title: `Cita: ${resource.clientName}`,
        description: `Estado: ${statusLabel} | Ubicación: ${resource.location}`,
      });
    },
    [toast]
  );

  // Personalizar las etiquetas del calendario
  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "No hay citas en este período",
    showMore: (total: number) => `+ Ver ${total} más`,
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => {
                  loadAppointments();
                  loadLocations();
                }}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Calendario de Citas
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {events.length} citas
            </Badge>
          )}
        </CardTitle>

        {/* Filtros */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todas las ubicaciones
                {allLocations.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({allLocations.length})</span>}
              </SelectItem>
              {allLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                  {location.city && <span className="ml-1 text-xs text-muted-foreground">- {location.city}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="requested">Pendientes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              loadAppointments();
              loadLocations();
            }}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={messages}
            popup
            tooltipAccessor={(event: AppointmentEvent) => {
              const { resource } = event;
              return `${resource.clientName} - ${resource.location}\nEstado: ${
                statusLabels[resource.status as keyof typeof statusLabels] || resource.status
              }`;
            }}
            formats={{
              timeGutterFormat: "HH:mm",
              eventTimeRangeFormat: ({ start, end }) => {
                return `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`;
              },
              agendaTimeFormat: "HH:mm",
              agendaTimeRangeFormat: ({ start, end }) => {
                return `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`;
              },
            }}
          />
        </div>

        {/* Leyenda de colores */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Leyenda:</span>
          </div>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{statusLabels[status as keyof typeof statusLabels] || status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
