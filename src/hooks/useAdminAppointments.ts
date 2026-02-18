// src/hooks/useAdminAppointments.ts
import { useEffect, useState, useCallback } from "react";
import { appointmentsApi } from "@/services/appointments";
import { useToast } from "@/components/ui/use-toast";
import { sortAppointments } from "@/components/appointments/appointment-utils";
import type { AdminAppointment } from "@/components/appointments/types";

interface UseAdminAppointmentsOptions {
  maxItems?: number;
}

interface UseAdminAppointmentsReturn {
  appointments: AdminAppointment[];
  loading: boolean;
  error: string | null;
  pendingCount: number;
  reload: () => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
}

export function useAdminAppointments(
  options: UseAdminAppointmentsOptions = {}
): UseAdminAppointmentsReturn {
  const { maxItems } = options;
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await appointmentsApi.listAll();

      if (!Array.isArray(data)) {
        throw new Error("Formato de datos inválido");
      }

      const sorted = sortAppointments(data as unknown as AdminAppointment[]);
      const limited = maxItems ? sorted.slice(0, maxItems) : sorted;

      setAppointments(limited);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar las citas";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [maxItems, toast]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const confirmAppointment = useCallback(
    async (id: string) => {
      try {
        await appointmentsApi.confirm(id);
        toast({
          title: "Éxito",
          description: "Cita confirmada correctamente",
          variant: "default",
        });
        await loadAppointments();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al confirmar la cita";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    },
    [loadAppointments, toast]
  );

  const pendingCount = appointments.filter((apt) => apt.status === "scheduled").length;

  return {
    appointments,
    loading,
    error,
    pendingCount,
    reload: loadAppointments,
    confirmAppointment,
  };
}
