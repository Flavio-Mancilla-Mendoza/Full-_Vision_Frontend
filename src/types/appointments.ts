// src/types/appointments.ts
// Re-exports for backwards compatibility — AppointmentStatus lives in database.ts,
// UserAppointment & CalendarAppointment in index.ts.
// We re-export them here so consumers can import from "@/types/appointments".
export type { AppointmentStatus } from "./database";
export type { UserAppointment, CalendarAppointment, ExamResults } from "./index";
