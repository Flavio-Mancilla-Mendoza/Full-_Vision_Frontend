// src/services/admin/appointments.ts - Gestión de citas (Admin) via API Gateway
import { appointmentsApi } from "@/services/api";
import type { ExamResults, PrescriptionDetails, DbLocation } from "@/types";

export interface EyeExamAppointment {
  id: string;
  user_id: string;
  location_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  exam_type: "comprehensive" | "basic" | "contact_lens" | "follow_up";
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  reason_for_visit?: string;
  has_insurance: boolean;
  insurance_provider?: string;
  current_prescription?: string;
  last_exam_date?: string;
  medical_conditions?: string;
  medications?: string;
  exam_results?: ExamResults;
  prescription_issued?: PrescriptionDetails;
  recommendations?: string;
  follow_up_needed: boolean;
  follow_up_date?: string;
  patient_notes?: string;
  doctor_notes?: string;
  location?: DbLocation;
  created_at: string;
  updated_at: string;
}

/**
 * Obtener todas las citas
 */
export async function getAllEyeExamAppointments(): Promise<EyeExamAppointment[]> {
  const data = await appointmentsApi.list();

  return ((data || []).map((appointment) => ({
    ...appointment,
    // Normalize the location join (lambda returns eye_exam_locations instead of location)
    location: (appointment as Record<string, unknown>).eye_exam_locations || appointment.location || null,
    exam_type: (appointment.exam_type || "comprehensive") as "comprehensive" | "basic" | "contact_lens" | "follow_up",
    exam_results: (appointment as Record<string, unknown>).exam_results as ExamResults,
    prescription_issued: (appointment as Record<string, unknown>).prescription_issued as PrescriptionDetails,
  }))) as unknown as EyeExamAppointment[];
}

/**
 * Crear nueva cita
 */
export async function createEyeExamAppointment(
  appointmentData: Omit<EyeExamAppointment, "id" | "created_at" | "updated_at" | "location">
) {
  const data = await appointmentsApi.create(appointmentData as Record<string, unknown>);
  return data;
}

/**
 * Actualizar cita
 */
export async function updateEyeExamAppointment(appointmentId: string, updates: Partial<EyeExamAppointment>) {
  const data = await appointmentsApi.update(appointmentId, updates as Record<string, unknown>);
  return data;
}
