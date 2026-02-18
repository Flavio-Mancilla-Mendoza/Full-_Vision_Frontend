// src/components/appointments/user-appointment-utils.ts
import type { UserAppointmentItem } from "./user-appointment-types";

/**
 * Formatea una fecha ISO a texto legible en español (Perú)
 * Ejemplo: "lunes, 15 de marzo de 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea hora HH:mm:ss → HH:mm
 */
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes}`;
}

/**
 * Determina si la fecha/hora de una cita ya pasó
 */
export function isPastAppointment(dateStr: string, timeStr: string): boolean {
  return new Date(`${dateStr}T${timeStr}`) < new Date();
}

/**
 * Determina si una cita puede ser cancelada por el usuario.
 * Solo citas pendientes y que aún no han pasado.
 */
export function canCancelAppointment(appointment: UserAppointmentItem): boolean {
  return (
    appointment.status === "pending" &&
    !isPastAppointment(appointment.appointment_date, appointment.appointment_time)
  );
}
