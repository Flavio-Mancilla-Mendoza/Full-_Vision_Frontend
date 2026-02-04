import { useState, useCallback } from "react";
import type { Location } from "@/types/location";
import type { LocationFormData } from "@/types/location";

export function useLocationManagement(initialForm: LocationFormData) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationsWithAppointments, setLocationsWithAppointments] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<LocationFormData>(initialForm);

  const resetLocationForm = useCallback(() => {
    setEditingLocation(null);
    setFormData(initialForm);
  }, [initialForm]);

  return {
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
    resetForm: resetLocationForm,
  };
}
