// src/hooks/useLocations.ts
/**
 * Hook unificado para gestión de ubicaciones
 * Consolida: useLocationManagement, useLoadLocations, useLocationDelete,
 * useLocationEdit, useLocationSubmit, useLocationToggleActive
 */

import { useState, useCallback } from "react";
import type { Location, LocationFormData } from "@/types/location";

const DEFAULT_FORM: LocationFormData = {
  name: "",
  address: "",
  city: "",
  phone: "",
  is_active: true,
  business_hours: "10:00-19:00",
};

interface UseLocationsOptions {
  initialForm?: LocationFormData;
}

interface UseLocationsDeps {
  toast: (opts: { title: string; description: string; variant?: "destructive" }) => void;
  confirm: (message: string) => Promise<boolean>;
  refresh: () => Promise<void> | void;
  // Servicios - tipos alineados con admin.ts
  createLocation: (data: Omit<Location, "id" | "created_at" | "updated_at">) => Promise<unknown>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<unknown>;
  deleteLocation: (id: string) => Promise<unknown>;
  checkLocationHasAppointments: (id: string) => Promise<boolean>;
}

export function useLocations(
  deps: UseLocationsDeps,
  options: UseLocationsOptions = {}
) {
  const { initialForm = DEFAULT_FORM } = options;
  const {
    toast,
    confirm,
    refresh,
    createLocation,
    updateLocation,
    deleteLocation,
    checkLocationHasAppointments,
  } = deps;

  // ============ Estado ============
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationsWithAppointments, setLocationsWithAppointments] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<LocationFormData>(initialForm);

  // ============ Acciones de formulario ============
  const resetForm = useCallback(() => {
    setEditingLocation(null);
    setFormData(initialForm);
  }, [initialForm]);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  // ============ CRUD Operations ============
  
  /**
   * Abre el diálogo de edición con los datos de la ubicación
   */
  const handleEdit = useCallback((location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      phone: location.phone || "",
      is_active: location.is_active,
      business_hours: location.business_hours || "10:00-19:00",
    });
    setIsDialogOpen(true);
  }, []);

  /**
   * Envía el formulario (crear o actualizar)
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Convertir formData al formato de la base de datos
        const dbData = {
          name: formData.name,
          address: formData.address || null,
          city: formData.city || null,
          phone: formData.phone || null,
          email: null,
          business_hours: formData.business_hours || null,
          is_active: formData.is_active,
        };

        if (editingLocation) {
          await updateLocation(editingLocation.id, dbData);
          toast({
            title: "Ubicación actualizada",
            description: "La ubicación se actualizó correctamente",
          });
        } else {
          await createLocation(dbData);
          toast({
            title: "Ubicación creada",
            description: "La ubicación se creó correctamente",
          });
        }
        closeDialog();
        await refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: editingLocation
            ? "No se pudo actualizar la ubicación"
            : "No se pudo crear la ubicación",
          variant: "destructive",
        });
      }
    },
    [editingLocation, formData, closeDialog, refresh, toast, updateLocation, createLocation]
  );

  /**
   * Alterna el estado activo/inactivo de una ubicación
   */
  const handleToggleActive = useCallback(
    async (location: Location) => {
      try {
        const newStatus = !location.is_active;
        await updateLocation(location.id, { is_active: newStatus });
        toast({
          title: newStatus ? "Ubicación activada" : "Ubicación desactivada",
          description: `La ubicación se ${newStatus ? "activó" : "desactivó"} correctamente`,
        });
        await refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cambiar el estado de la ubicación",
          variant: "destructive",
        });
      }
    },
    [updateLocation, toast, refresh]
  );

  /**
   * Elimina una ubicación (o la desactiva si tiene citas)
   */
  const handleDelete = useCallback(
    async (location: Location) => {
      try {
        const hasAppointments = await checkLocationHasAppointments(location.id);
        
        if (hasAppointments) {
          const shouldDeactivate = await confirm(
            `⚠️ Esta ubicación tiene citas asociadas y no puede ser eliminada.\n\n¿Quieres desactivarla en su lugar? Esto la ocultará de la selección pero mantendrá las citas existentes.`
          );
          if (shouldDeactivate) {
            await updateLocation(location.id, { is_active: false });
            toast({
              title: "Ubicación desactivada",
              description: "La ubicación se desactivó correctamente",
            });
            await refresh();
          }
          return;
        }

        const shouldDelete = await confirm(
          "¿Estás seguro de que quieres eliminar esta ubicación permanentemente?"
        );
        if (shouldDelete) {
          await deleteLocation(location.id);
          toast({
            title: "Ubicación eliminada",
            description: "La ubicación se eliminó correctamente",
          });
          await refresh();
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
    [checkLocationHasAppointments, updateLocation, deleteLocation, toast, refresh, confirm]
  );

  /**
   * Verifica qué ubicaciones tienen citas asociadas
   */
  const checkAppointmentsForLocations = useCallback(
    async (locations: Location[]) => {
      const setWithAppts = new Set<string>();
      await Promise.all(
        locations.map(async (loc) => {
          try {
            const has = await checkLocationHasAppointments(loc.id);
            if (has) setWithAppts.add(loc.id);
          } catch {
            // Ignorar errores individuales
          }
        })
      );
      setLocationsWithAppointments(setWithAppts);
    },
    [checkLocationHasAppointments]
  );

  return {
    // Estado del diálogo
    isDialogOpen,
    setIsDialogOpen,
    editingLocation,
    locationsWithAppointments,
    
    // Formulario
    formData,
    setFormData,
    resetForm,
    
    // Acciones
    openCreateDialog,
    closeDialog,
    handleEdit,
    handleSubmit,
    handleToggleActive,
    handleDelete,
    checkAppointmentsForLocations,
  };
}

export type { LocationFormData };
