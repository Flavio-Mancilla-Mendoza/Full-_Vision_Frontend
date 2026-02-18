// src/components/appointments/appointment-utils.ts
import type { AdminAppointment, AppointmentLocation } from "./types";

// ================================================================
// Status Configuration
// ================================================================

export type StatusVariant = "secondary" | "default" | "outline" | "destructive";

export interface StatusConfig {
  variant: StatusVariant;
  iconName: "clock" | "check-circle" | "alert-circle";
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  requested: { variant: "secondary", iconName: "clock", label: "Pendiente" },
  pending: { variant: "secondary", iconName: "clock", label: "Pendiente" },
  scheduled: { variant: "secondary", iconName: "clock", label: "Programada" },
  confirmed: { variant: "default", iconName: "check-circle", label: "Confirmada" },
  completed: { variant: "outline", iconName: "check-circle", label: "Completada" },
  cancelled: { variant: "destructive", iconName: "alert-circle", label: "Cancelada" },
};

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.requested;
}

// ================================================================
// Date Formatting
// ================================================================

export function formatAppointmentDate(appointment: AdminAppointment): string {
  try {
    let dateToFormat: Date;

    if (appointment.scheduled_at) {
      dateToFormat = new Date(appointment.scheduled_at);
    } else if (appointment.appointment_date && appointment.appointment_time) {
      dateToFormat = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
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
}

// ================================================================
// Location Helpers
// ================================================================

/**
 * Extrae la ubicación de una cita, soportando tanto objeto directo como array
 * (Supabase puede retornar ambos formatos según la relación)
 */
export function getAppointmentLocation(
  eyeExamLocations: AdminAppointment["eye_exam_locations"]
): AppointmentLocation | null {
  if (!eyeExamLocations) return null;

  if (Array.isArray(eyeExamLocations)) {
    return eyeExamLocations[0] ?? null;
  }

  return eyeExamLocations;
}

// ================================================================
// Client Info Helpers
// ================================================================

export function getClientName(appointment: AdminAppointment): string {
  return appointment.patient_name || appointment.profiles?.[0]?.full_name || "Cliente sin nombre";
}

export function getClientEmail(appointment: AdminAppointment): string | undefined {
  return appointment.patient_email || appointment.profiles?.[0]?.email;
}

// ================================================================
// Sorting
// ================================================================

/**
 * Ordena citas: primero las programadas (pendientes), luego por fecha ascendente
 */
export function sortAppointments(appointments: AdminAppointment[]): AdminAppointment[] {
  return [...appointments].sort((a, b) => {
    const aIsPending = a.status === "scheduled";
    const bIsPending = b.status === "scheduled";

    if (aIsPending && !bIsPending) return -1;
    if (bIsPending && !aIsPending) return 1;

    const getDateString = (apt: AdminAppointment): string => {
      if (apt.scheduled_at) return apt.scheduled_at;
      if (apt.appointment_date && apt.appointment_time) {
        return `${apt.appointment_date}T${apt.appointment_time}`;
      }
      return "";
    };

    return new Date(getDateString(a)).getTime() - new Date(getDateString(b)).getTime();
  });
}
