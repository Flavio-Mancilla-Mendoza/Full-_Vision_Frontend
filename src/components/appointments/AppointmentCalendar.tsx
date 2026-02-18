// src/components/appointments/AppointmentCalendar.tsx
import { useState, useCallback } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCalendarAppointments } from "@/hooks/useCalendarAppointments";
import { CalendarFilters } from "./CalendarFilters";
import { CalendarLegend } from "./CalendarLegend";
import { getEventStyle, getEventTooltip, getEventDescription } from "./calendar-utils";
import { CALENDAR_MESSAGES } from "./calendar-constants";
import type { AppointmentEvent } from "./calendar-constants";

// Configurar moment en español
moment.locale("es");
const localizer = momentLocalizer(moment);

export default function AppointmentCalendar() {
  const { toast } = useToast();
  const {
    events,
    locations,
    loading,
    error,
    filters,
    setLocationFilter,
    setStatusFilter,
    reload,
  } = useCalendarAppointments();

  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const handleSelectEvent = useCallback(
    (event: AppointmentEvent) => {
      const { title, description } = getEventDescription(event);
      toast({ title, description });
    },
    [toast]
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" className="ml-2" onClick={reload}>
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

        <CalendarFilters
          locations={locations}
          selectedLocation={filters.locationId}
          selectedStatus={filters.status}
          loading={loading}
          onLocationChange={setLocationFilter}
          onStatusChange={setStatusFilter}
          onRefresh={reload}
        />
      </CardHeader>

      <CardContent>
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            eventPropGetter={getEventStyle}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={CALENDAR_MESSAGES}
            popup
            tooltipAccessor={getEventTooltip}
            formats={{
              timeGutterFormat: "HH:mm",
              eventTimeRangeFormat: ({ start, end }) =>
                `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
              agendaTimeFormat: "HH:mm",
              agendaTimeRangeFormat: ({ start, end }) =>
                `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
            }}
          />
        </div>

        <CalendarLegend />
      </CardContent>
    </Card>
  );
}
