// src/services/admin/locations.ts - Gestión de ubicaciones (Admin) via API Gateway
import { locationsApi, getApiUrl } from "@/services/api";
import { getAuthToken } from "./helpers";
import type { Location } from "@/types/location";

// Re-export type
export type { Location };

/**
 * Obtener todas las ubicaciones
 */
export async function getAllLocations(): Promise<Location[]> {
  const data = await locationsApi.list();
  return (data || []) as unknown as Location[];
}

/**
 * Obtener ubicaciones con paginación y filtros (client-side filtering)
 */
export async function getAllLocationsPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string } = {}
): Promise<{ data: Location[]; count: number; totalPages: number }> {
  const allLocations = (await locationsApi.list()) as unknown as Location[];
  let filtered = allLocations || [];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (loc) =>
        loc.name?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q) ||
        loc.city?.toLowerCase().includes(q)
    );
  }

  const count = filtered.length;
  const totalPages = Math.ceil(count / limit);
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return { data: paged, count, totalPages };
}

/**
 * Crear ubicación
 */
export async function createLocation(locationData: Omit<Location, "id" | "created_at" | "updated_at">) {
  const data = await locationsApi.create(locationData as Record<string, unknown>);
  return data;
}

/**
 * Actualizar ubicación
 */
export async function updateLocation(locationId: string, updates: Partial<Location>) {
  const data = await locationsApi.update(locationId, updates as Record<string, unknown>);
  return data;
}

/**
 * Verificar si una ubicación tiene citas asociadas
 */
export async function checkLocationHasAppointments(locationId: string): Promise<boolean> {
  try {
    // Attempt to delete - the Lambda will return 400 if there are associated appointments
    // We use a GET on appointments and filter client-side instead
    const { appointmentsApi } = await import("@/services/api");
    const appointments = await appointmentsApi.list();
    return (appointments || []).some((a) => a.location_id === locationId);
  } catch {
    return false;
  }
}

/**
 * Eliminar ubicación
 */
export async function deleteLocation(locationId: string) {
  const hasAppointments = await checkLocationHasAppointments(locationId);

  if (hasAppointments) {
    throw new Error("No se puede eliminar la ubicación porque tiene citas asociadas. Puedes desactivarla en su lugar.");
  }

  await locationsApi.delete(locationId);
  return { id: locationId };
}
