// src/components/appointments/user-appointment-types.ts
import type { AppointmentLocation } from "./types";

/**
 * Cita desde la perspectiva del usuario (datos retornados por /appointments/user)
 */
export interface UserAppointmentItem {
  id: string;
  status: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  patient_name: string;
  exam_type: string;
  duration_minutes: number;
  created_at: string;
  eye_exam_locations: AppointmentLocation | null;
}

/**
 * Configuración visual de cada status de cita
 */
export interface StatusDisplayConfig {
  label: string;
  color: string;
  borderColor: string;
  iconName: "alert-circle" | "check-circle" | "x-circle";
  description: string;
}

export const USER_STATUS_CONFIG: Record<string, StatusDisplayConfig> = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    borderColor: "border-l-yellow-400",
    iconName: "alert-circle",
    description: "Esperando confirmación",
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-800 border-green-200",
    borderColor: "border-l-green-400",
    iconName: "check-circle",
    description: "Cita confirmada",
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-200",
    borderColor: "border-l-red-400",
    iconName: "x-circle",
    description: "Cita cancelada",
  },
  completed: {
    label: "Completada",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    borderColor: "border-l-blue-400",
    iconName: "check-circle",
    description: "Examen realizado",
  },
};

export function getStatusDisplay(status: string): StatusDisplayConfig {
  return USER_STATUS_CONFIG[status] ?? USER_STATUS_CONFIG.pending;
}
