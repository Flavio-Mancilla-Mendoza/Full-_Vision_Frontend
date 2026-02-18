// src/components/appointments/calendar-utils.ts
import type { CalendarAppointment } from "@/types/appointments";
import type { AppointmentEvent } from "./calendar-constants";
import { STATUS_COLORS, STATUS_LABELS, DEFAULT_DURATION_MS } from "./calendar-constants";

// ================================================================
// Filtering
// ================================================================

interface CalendarFilters {
  locationId: string; // "all" = sin filtro
  status: string;     // "all" = sin filtro
}

export function filterAppointments(
  appointments: CalendarAppointment[],
  filters: CalendarFilters
): CalendarAppointment[] {
  return appointments.filter((apt) => {
    if (filters.locationId !== "all" && apt.eye_exam_locations?.id !== filters.locationId) {
      return false;
    }
    if (filters.status !== "all" && apt.status !== filters.status) {
      return false;
    }
    return true;
  });
}

// ================================================================
// Mapping: CalendarAppointment → AppointmentEvent
// ================================================================

export function mapToCalendarEvent(apt: CalendarAppointment): AppointmentEvent {
  let eventDate: Date;

  if (apt.appointment_date && apt.appointment_time) {
    eventDate = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
  } else {
    eventDate = new Date();
  }

  const endDate = new Date(eventDate.getTime() + DEFAULT_DURATION_MS);
  const locationName = apt.eye_exam_locations?.name || "Sin ubicación";
  const clientName = apt.patient_name || "Cliente sin nombre";

  return {
    title: `${clientName} - ${locationName}`,
    start: eventDate,
    end: endDate,
    resource: {
      id: apt.id,
      status: apt.status,
      location: locationName,
      locationId: apt.eye_exam_locations?.id || "",
      clientName,
      clientEmail: apt.patient_email ?? undefined,
      notes: apt.notes ?? undefined,
    },
  };
}

export function mapToCalendarEvents(
  appointments: CalendarAppointment[],
  filters: CalendarFilters
): AppointmentEvent[] {
  return filterAppointments(appointments, filters).map(mapToCalendarEvent);
}

// ================================================================
// Event Styling
// ================================================================

export function getEventStyle(event: AppointmentEvent) {
  const backgroundColor = STATUS_COLORS[event.resource.status] || "#6b7280";

  return {
    style: {
      backgroundColor,
      borderRadius: "4px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block" as const,
      fontSize: "12px",
      padding: "2px 4px",
    },
  };
}

// ================================================================
// Event Tooltip
// ================================================================

export function getEventTooltip(event: AppointmentEvent): string {
  const { resource } = event;
  const statusLabel = STATUS_LABELS[resource.status] || resource.status;
  return `${resource.clientName} - ${resource.location}\nEstado: ${statusLabel}`;
}

export function getEventDescription(event: AppointmentEvent): {
  title: string;
  description: string;
} {
  const { resource } = event;
  const statusLabel = STATUS_LABELS[resource.status] || resource.status;
  return {
    title: `Cita: ${resource.clientName}`,
    description: `Estado: ${statusLabel} | Ubicación: ${resource.location}`,
  };
}
