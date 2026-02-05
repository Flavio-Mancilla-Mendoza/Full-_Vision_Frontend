// src/services/admin/appointments.ts - Gestión de citas (Admin)
import { supabase } from "@/lib/supabase";
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
  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .select(`
      *,
      location:eye_exam_locations(*)
    `)
    .order("appointment_date", { ascending: false });

  if (error) throw error;
  return ((data || []).map((appointment) => ({
    ...appointment,
    exam_type: appointment.exam_type as "comprehensive" | "basic" | "contact_lens" | "follow_up",
    exam_results: appointment.exam_results as ExamResults,
    prescription_issued: appointment.prescription_issued as PrescriptionDetails,
  }))) as unknown as EyeExamAppointment[];
}

/**
 * Crear nueva cita
 */
export async function createEyeExamAppointment(
  appointmentData: Omit<EyeExamAppointment, "id" | "created_at" | "updated_at" | "location">
) {
  const { data, error } = await supabase.from("eye_exam_appointments").insert([appointmentData]).select().single();

  if (error) throw error;
  return data;
}

/**
 * Actualizar cita
 */
export async function updateEyeExamAppointment(appointmentId: string, updates: Partial<EyeExamAppointment>) {
  const { data, error } = await supabase.from("eye_exam_appointments").update(updates).eq("id", appointmentId).select().single();

  if (error) throw error;
  return data;
}
