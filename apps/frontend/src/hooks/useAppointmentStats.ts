// src/hooks/useAppointmentStats.ts
import { useState, useEffect, useCallback } from "react";
import { listAppointmentsAll } from "@/services/appointments";
import { CalendarAppointment } from "@/types";

interface AppointmentStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  locationStats: Array<{
    locationId: string;
    locationName: string;
    count: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  }>;
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
}

export function useAppointmentStats() {
  const [stats, setStats] = useState<AppointmentStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    locationStats: [],
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback((appointments: CalendarAppointment[]): AppointmentStats => {
    if (!appointments || appointments.length === 0) {
      return {
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        locationStats: [],
        todayAppointments: 0,
        weekAppointments: 0,
        monthAppointments: 0,
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Estadísticas generales
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter((apt) => apt.status === "scheduled").length;
    const confirmedAppointments = appointments.filter((apt) => apt.status === "confirmed").length;
    const completedAppointments = appointments.filter((apt) => apt.status === "completed").length;
    const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled").length;

    // Estadísticas por tiempo
    let todayAppointments = 0;
    let weekAppointments = 0;
    let monthAppointments = 0;

    // Estadísticas por ubicación
    const locationMap = new Map<
      string,
      {
        locationName: string;
        count: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
      }
    >();

    appointments.forEach((apt) => {
      // Calcular fecha del evento
      let eventDate: Date;

      if (apt.appointment_date && apt.appointment_time) {
        const dateTimeString = `${apt.appointment_date}T${apt.appointment_time}`;
        eventDate = new Date(dateTimeString);
      } else {
        eventDate = new Date();
      }

      // Contar por tiempo
      if (eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        todayAppointments++;
      }
      if (eventDate >= today && eventDate < weekFromNow) {
        weekAppointments++;
      }
      if (eventDate >= today && eventDate < monthFromNow) {
        monthAppointments++;
      }

      // Estadísticas por ubicación
      const location = apt.eye_exam_locations;
      if (location) {
        const locationId = location.id;
        const locationName = location.name;

        if (!locationMap.has(locationId)) {
          locationMap.set(locationId, {
            locationName,
            count: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
          });
        }

        const locationStats = locationMap.get(locationId)!;
        locationStats.count++;

        switch (apt.status) {
          case "scheduled":
            locationStats.pending++;
            break;
          case "confirmed":
            locationStats.confirmed++;
            break;
          case "completed":
            locationStats.completed++;
            break;
          case "cancelled":
            locationStats.cancelled++;
            break;
        }
      }
    });

    const locationStats = Array.from(locationMap.entries()).map(([locationId, stats]) => ({
      locationId,
      ...stats,
    }));

    return {
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      locationStats,
      todayAppointments,
      weekAppointments,
      monthAppointments,
    };
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const appointments = await listAppointmentsAll();
      const calculatedStats = calculateStats(appointments || []);
      setStats(calculatedStats);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar estadísticas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
}
