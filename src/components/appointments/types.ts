// src/components/appointments/types.ts
import type { AppointmentStatus } from "@/types/appointments";

/**
 * Ubicación simplificada retornada por el join de Supabase
 */
export interface AppointmentLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
}

/**
 * Interfaz de cita para vista administrativa
 * Extiende los datos de la base de datos con campos de relaciones (joins)
 */
export interface AdminAppointment {
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
  eye_exam_locations?: AppointmentLocation | AppointmentLocation[] | null;
  profiles?: Array<{
    full_name: string;
    email?: string;
    phone?: string;
  }>;
}

export interface AdminAppointmentsListProps {
  className?: string;
  maxItems?: number;
}
