// src/hooks/useCalendarAppointments.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { appointmentsApi } from "@/services/appointments";
import { getAllLocations } from "@/services/admin";
import { useToast } from "@/components/ui/use-toast";
import { mapToCalendarEvents } from "@/components/appointments/calendar-utils";
import type { CalendarAppointment } from "@/types/appointments";
import type { Location } from "@/types/location";
import type { AppointmentEvent } from "@/components/appointments/calendar-constants";

interface CalendarFilters {
  locationId: string;
  status: string;
}

interface UseCalendarAppointmentsReturn {
  appointments: CalendarAppointment[];
  events: AppointmentEvent[];
  locations: Location[];
  loading: boolean;
  error: string | null;
  filters: CalendarFilters;
  setLocationFilter: (locationId: string) => void;
  setStatusFilter: (status: string) => void;
  reload: () => Promise<void>;
}

export function useCalendarAppointments(): UseCalendarAppointmentsReturn {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    locationId: "all",
    status: "all",
  });

  const loadLocations = useCallback(async () => {
    try {
      const data = await getAllLocations();
      setLocations(data.filter((loc) => loc.is_active));
    } catch (err) {
      console.error("Error loading locations:", err);
      toast({
        title: "Advertencia",
        description: "No se pudieron cargar todas las ubicaciones. Se mostrarán solo las que tienen citas.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await appointmentsApi.listAll();
      setAppointments(data || []);
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
  }, [toast]);

  const reload = useCallback(async () => {
    await Promise.all([loadAppointments(), loadLocations()]);
  }, [loadAppointments, loadLocations]);

  useEffect(() => {
    reload();
  }, [reload]);

  const events = useMemo(
    () => mapToCalendarEvents(appointments, filters),
    [appointments, filters]
  );

  const setLocationFilter = useCallback((locationId: string) => {
    setFilters((prev) => ({ ...prev, locationId }));
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  return {
    appointments,
    events,
    locations,
    loading,
    error,
    filters,
    setLocationFilter,
    setStatusFilter,
    reload,
  };
}
