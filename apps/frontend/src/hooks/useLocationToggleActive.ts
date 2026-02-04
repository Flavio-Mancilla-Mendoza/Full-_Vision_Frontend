import { useCallback } from "react";
import type { Location } from "@/types/location";

export function useLocationToggleActive({ updateLocation, toast, loadLocations }) {
  return useCallback(
    async (location: Location) => {
      try {
        const newStatus = !location.is_active;
        await updateLocation(location.id, { is_active: newStatus });
        toast({
          title: newStatus ? "Ubicación activada" : "Ubicación desactivada",
          description: `La ubicación se ${newStatus ? "activó" : "desactivó"} correctamente`,
        });
        loadLocations();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cambiar el estado de la ubicación",
          variant: "destructive",
        });
      }
    },
    [updateLocation, toast, loadLocations]
  );
}
