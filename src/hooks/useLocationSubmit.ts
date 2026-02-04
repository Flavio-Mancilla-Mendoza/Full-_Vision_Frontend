import { useCallback } from "react";
import type { Location } from "@/types/location";
import type { updateLocation, createLocation } from "@/services/admin";
import type { LocationFormData } from "@/types/location";

export function useLocationSubmit({
  editingLocation,
  formData,
  setIsDialogOpen,
  resetForm,
  loadLocations,
  toast,
  updateLocation,
  createLocation,
}) {
  return useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingLocation) {
          await updateLocation(editingLocation.id, formData);
          toast({
            title: "Ubicación actualizada",
            description: "La ubicación se actualizó correctamente",
          });
        } else {
          await createLocation(formData);
          toast({
            title: "Ubicación creada",
            description: "La ubicación se creó correctamente",
          });
        }
        setIsDialogOpen(false);
        resetForm();
        loadLocations();
      } catch (error) {
        toast({
          title: "Error",
          description: editingLocation ? "No se pudo actualizar la ubicación" : "No se pudo crear la ubicación",
          variant: "destructive",
        });
      }
    },
    [editingLocation, formData, setIsDialogOpen, resetForm, loadLocations, toast, updateLocation, createLocation]
  );
}
