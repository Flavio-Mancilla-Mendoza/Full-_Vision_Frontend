// src/hooks/useAppointments.ts
import { useState, useEffect, useCallback } from "react";
import { appointmentsApi } from "@/services/appointments";
import { useUser } from "@/hooks/auth";
import type { UserAppointment } from "@/types/appointments";

export function useAppointments() {
  const { isAuthenticated } = useUser();
  const [appointments, setAppointments] = useState<UserAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    // Solo cargar si el usuario está autenticado
    if (!isAuthenticated) {
      setAppointments([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await appointmentsApi.listUser();
      setAppointments(data || []);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError(err instanceof Error ? err.message : "Error al cargar las citas");
      setAppointments([]); // Reset on error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
    } else {
      // Limpiar estado cuando no está autenticado
      setAppointments([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated, loadAppointments]);

  // Citas pendientes (pending o confirmed que no han pasado)
  const pendingAppointments = appointments.filter((appointment: UserAppointment) => {
    if (!appointment || typeof appointment !== "object") return false;

    if (appointment.status !== "pending" && appointment.status !== "confirmed") {
      return false;
    }

    try {
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      return appointmentDateTime > new Date();
    } catch {
      return false;
    }
  });

  // Próxima cita
  const nextAppointment =
    pendingAppointments.length > 0
      ? pendingAppointments.sort((a: UserAppointment, b: UserAppointment) => {
          try {
            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
            return dateA.getTime() - dateB.getTime();
          } catch {
            return 0;
          }
        })[0]
      : null;

  return {
    appointments,
    pendingAppointments,
    nextAppointment,
    loading,
    error,
    refetch: loadAppointments,
  };
}
