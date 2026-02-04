import { useCallback } from "react";
import type { Location } from "@/types/location";

export function useLocationDelete({
  checkLocationHasAppointments,
  updateLocation,
  deleteLocation,
  toast,
  loadLocations,
  confirm,
}: {
  checkLocationHasAppointments: (id: string) => Promise<boolean>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<any>;
  deleteLocation: (id: string) => Promise<any>;
  toast: any;
  loadLocations: () => Promise<void> | void;
  confirm: (message: string) => Promise<boolean>;
}) {
  return useCallback(
    async (location: Location) => {
      try {
        const hasAppointments = await checkLocationHasAppointments(location.id);
        if (hasAppointments) {
          const shouldDeactivate = await confirm(
            `⚠️ Esta ubicación tiene citas asociadas y no puede ser eliminada.\\n\\n¿Quieres desactivarla en su lugar? Esto la ocultará de la selección pero mantendrá las citas existentes.`
          );
          if (shouldDeactivate) {
            await updateLocation(location.id, { is_active: false });
            toast({
              title: "Ubicación desactivada",
              description: "La ubicación se desactivó correctamente",
            });
            await loadLocations();
          }
          return;
        }
        const shouldDelete = await confirm("¿Estás seguro de que quieres eliminar esta ubicación permanentemente?");
        if (shouldDelete) {
          await deleteLocation(location.id);
          toast({
            title: "Ubicación eliminada",
            description: "La ubicación se eliminó correctamente",
          });
          await loadLocations();
        }
      } catch (error) {
        console.error("Error al procesar eliminación:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo procesar la solicitud",
          variant: "destructive",
        });
      }
    },
    [checkLocationHasAppointments, updateLocation, deleteLocation, toast, loadLocations, confirm]
  );
}
