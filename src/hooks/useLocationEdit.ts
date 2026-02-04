import { useCallback } from "react";
import type { Location } from "@/types/location";
import type { LocationFormData } from "@/types/location";

export function useLocationEdit({ setEditingLocation, setFormData, setIsDialogOpen }) {
  return useCallback(
    (location: Location) => {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city,
        phone: location.phone || "",
        is_active: location.is_active,
        business_hours: location.business_hours || "09:00-18:00",
      });
      setIsDialogOpen(true);
    },
    [setEditingLocation, setFormData, setIsDialogOpen]
  );
}
