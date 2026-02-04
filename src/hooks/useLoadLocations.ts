import { useCallback } from "react";
import type { Location } from "@/types/location";

export function useLoadLocations({
  setLoading,
  setLocations,
  setLocationsWithAppointments,
  toast,
  getAllLocations,
  checkLocationHasAppointments,
}) {
  return useCallback(async () => {
    try {
      setLoading(true);
      const fetchedLocations = await getAllLocations();
      setLocations(fetchedLocations);
      const locationsWithAppts = new Set<string>();
      for (const location of fetchedLocations) {
        try {
          const hasAppointments = await checkLocationHasAppointments(location.id);
          if (hasAppointments) {
            locationsWithAppts.add(location.id);
          }
        } catch (error) {
          console.warn(`Error checking appointments for location ${location.id}:`, error);
        }
      }
      setLocationsWithAppointments(locationsWithAppts);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las ubicaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setLocations, setLocationsWithAppointments, toast, getAllLocations, checkLocationHasAppointments]);
}
