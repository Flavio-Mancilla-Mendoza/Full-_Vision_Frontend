import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { LocationHeader } from "@/components/admin/location/LocationHeader";
import { LocationPagination } from "@/components/admin/location/LocationPagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { LocationTable } from "@/components/admin/location/LocationTable";

import { Plus, MapPin } from "lucide-react";

import { createLocation, updateLocation, deleteLocation, checkLocationHasAppointments, getAllLocationsPaginated } from "@/services/admin";
import type { Location } from "@/types/location";

import { useLocationManagement } from "@/hooks/useLocationManagement";
import { usePagination } from "@/hooks/usePagination";
import { useLocationSubmit } from "@/hooks/useLocationSubmit";
import { LocationForm } from "@/components/admin/location/LocationForm";
import { useToast } from "@/components/ui/use-toast";
import { useLocationDelete } from "@/hooks/useLocationDelete";
import { useLocationToggleActive } from "@/hooks/useLocationToggleActive";
import { useLocationEdit } from "@/hooks/useLocationEdit";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

function LocationManagementInner() {
  const {
    locations,
    setLocations,
    loading,
    setLoading,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    editingLocation,
    setEditingLocation,
    locationsWithAppointments,
    setLocationsWithAppointments,
    formData,
    setFormData,
    resetForm,
  } = useLocationManagement({
    name: "",
    address: "",
    city: "",
    phone: "",
    is_active: true,
    business_hours: "09:00-18:00",
  });
  const { toast } = useToast();

  // Paginación de ubicaciones
  const {
    data: pagedLocations,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    isLoading,
    refresh,
  } = usePagination<Location>({
    key: ["locations"],
    fetcher: getAllLocationsPaginated,
    initialPageSize: 10,
  });

  useEffect(() => {
    setLocations(pagedLocations);
  }, [pagedLocations, setLocations]);

  // Sincronizar búsqueda con filtros del paginador
  useEffect(() => {
    setFilters({ search: searchTerm });
    setPage(1);
  }, [searchTerm, setFilters, setPage]);

  // Revisar si las ubicaciones en la página actual tienen citas
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const setWithAppts = new Set<string>();
        await Promise.all(
          pagedLocations.map(async (loc) => {
            try {
              const has = await checkLocationHasAppointments(loc.id);
              if (has) setWithAppts.add(loc.id);
            } catch (err) {
              // ignore per-location errors
            }
          })
        );
        if (mounted) setLocationsWithAppointments(setWithAppts);
      } catch (err) {
        // noop
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pagedLocations, setLocationsWithAppointments]);

  const confirm = useConfirm();

  const handleSubmit = useLocationSubmit({
    editingLocation,
    formData,
    setIsDialogOpen,
    resetForm,
    loadLocations: async () => {
      await refresh();
    },
    toast,
    updateLocation,
    createLocation,
  });
  const handleEdit = useLocationEdit({ setEditingLocation, setFormData, setIsDialogOpen });

  const handleToggleActive = useLocationToggleActive({
    updateLocation,
    toast,
    loadLocations: async () => {
      await refresh();
    },
  });

  const handleDelete = useLocationDelete({
    checkLocationHasAppointments,
    updateLocation,
    deleteLocation,
    toast,
    loadLocations: async () => {
      await refresh();
    },
    confirm,
  });

  // Simple filter: server already returns filtered results, but keep local loading flag
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Gestión de Ubicaciones
        </CardTitle>
        <CardDescription>Administra las ubicaciones para exámenes oculares</CardDescription>
        <div className="flex gap-4">
          <LocationHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreate={() => {
              setIsDialogOpen(true);
              resetForm();
            }}
          />
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingLocation ? "Editar Ubicación" : "Crear Ubicación"}</DialogTitle>
                <DialogDescription>
                  {editingLocation ? "Modifica los datos de la ubicación" : "Completa el formulario para crear una nueva ubicación"}
                </DialogDescription>
              </DialogHeader>
              <LocationForm formData={formData} onChange={setFormData} onSubmit={handleSubmit} editingLocation={!!editingLocation} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando ubicaciones...</div>
        ) : (
          <LocationTable
            locations={pagedLocations}
            locationsWithAppointments={locationsWithAppointments}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        )}
      </CardContent>
      {totalPages > 1 && (
        <LocationPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          isLoading={isLoading}
        />
      )}
    </Card>
  );
}

export const LocationManagement: React.FC = () => (
  <ConfirmProvider>
    <LocationManagementInner />
  </ConfirmProvider>
);
