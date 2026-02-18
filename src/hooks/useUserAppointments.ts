// src/hooks/useUserAppointments.ts
import { useEffect, useState, useCallback } from "react";
import { appointmentsApi } from "@/services/appointments";
import { useToast } from "@/components/ui/use-toast";
import type { UserAppointmentItem } from "@/components/appointments/user-appointment-types";

interface UseUserAppointmentsReturn {
  appointments: UserAppointmentItem[];
  loading: boolean;
  error: string | null;
  cancellingId: string | null;
  reload: () => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
}

export function useUserAppointments(): UseUserAppointmentsReturn {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<UserAppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentsApi.listUser();
      setAppointments(data as unknown as UserAppointmentItem[]);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError(err instanceof Error ? err.message : "Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const cancelAppointment = useCallback(
    async (id: string) => {
      try {
        setCancellingId(id);
        await appointmentsApi.cancel(id);

        toast({
          title: "Cita cancelada",
          description: "Tu cita ha sido cancelada exitosamente.",
        });

        await loadAppointments();
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "No se pudo cancelar la cita",
          variant: "destructive",
        });
      } finally {
        setCancellingId(null);
      }
    },
    [loadAppointments, toast]
  );

  return {
    appointments,
    loading,
    error,
    cancellingId,
    reload: loadAppointments,
    cancelAppointment,
  };
}
