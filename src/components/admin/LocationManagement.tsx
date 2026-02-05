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

import { useLocations } from "@/hooks/useLocations";
import { usePagination } from "@/hooks/usePagination";
import { LocationForm } from "@/components/admin/location/LocationForm";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

function LocationManagementInner() {
  const { toast } = useToast();
  const confirm = useConfirm();

  // Paginación de ubicaciones
  const {
    data: pagedLocations,
    total: totalCount,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    setFilters,
    isLoading,
    refresh,
  } = usePagination<Location>({
    key: ["locations"],
    fetcher: getAllLocationsPaginated,
    initialPageSize: 10,
  });

  // Hook unificado de ubicaciones
  const {
    isDialogOpen,
    setIsDialogOpen,
    editingLocation,
    locationsWithAppointments,
    formData,
    setFormData,
    openCreateDialog,
    closeDialog,
    handleEdit,
    handleSubmit,
    handleToggleActive,
    handleDelete,
    checkAppointmentsForLocations,
  } = useLocations({
    toast,
    confirm,
    refresh: async () => {
      await refresh();
    },
    createLocation,
    updateLocation,
    deleteLocation,
    checkLocationHasAppointments,
  });

  // Estado de búsqueda local
  const [searchTerm, setSearchTerm] = React.useState("");

  // Sincronizar búsqueda con filtros del paginador
  useEffect(() => {
    setFilters({ search: searchTerm });
    setPage(1);
  }, [searchTerm, setFilters, setPage]);

  // Revisar si las ubicaciones en la página actual tienen citas
  useEffect(() => {
    let mounted = true;
    checkAppointmentsForLocations(pagedLocations).then(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [pagedLocations, checkAppointmentsForLocations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Gestión de Ubicaciones
        </CardTitle>
        <CardDescription>Administra las ubicaciones para exámenes oculares</CardDescription>
        <div className="flex gap-4">
          <LocationHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} onCreate={openCreateDialog} />
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) closeDialog();
              else setIsDialogOpen(true);
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
        {isLoading ? (
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
