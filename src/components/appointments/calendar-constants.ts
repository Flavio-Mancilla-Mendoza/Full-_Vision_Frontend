// src/components/appointments/calendar-constants.ts

// ================================================================
// Calendar Event Type
// ================================================================

export interface AppointmentEventResource {
  id: string;
  status: string;
  location: string;
  locationId: string;
  clientName: string;
  clientEmail?: string;
  notes?: string;
}

export interface AppointmentEvent {
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentEventResource;
}

// ================================================================
// Status Colors & Labels
// ================================================================

export const STATUS_COLORS: Record<string, string> = {
  requested: "#f59e0b", // amber
  pending: "#f59e0b", // amber
  scheduled: "#f59e0b", // amber
  confirmed: "#10b981", // emerald
  completed: "#6b7280", // gray
  cancelled: "#ef4444", // red
};

export const STATUS_LABELS: Record<string, string> = {
  requested: "Pendiente",
  pending: "Pendiente",
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

// ================================================================
// Calendar i18n Messages (Spanish)
// ================================================================

export const CALENDAR_MESSAGES = {
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

// ================================================================
// Default Event Duration (ms)
// ================================================================

export const DEFAULT_DURATION_MS = 60 * 60 * 1000; // 1 hora
