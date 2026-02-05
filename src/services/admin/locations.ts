// src/services/admin/locations.ts - Gestión de ubicaciones (Admin)
import { supabase } from "@/lib/supabase";
import type { Location } from "@/types/location";

// Re-export type
export type { Location };

/**
 * Obtener todas las ubicaciones
 */
export async function getAllLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from("eye_exam_locations").select("*").order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Obtener ubicaciones con paginación y filtros
 */
export async function getAllLocationsPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string } = {}
): Promise<{ data: Location[]; count: number; totalPages: number }> {
  let query = supabase
    .from("eye_exam_locations")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`name.ilike.${q},address.ilike.${q},city.ilike.${q}`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as Location[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Crear ubicación
 */
export async function createLocation(locationData: Omit<Location, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("eye_exam_locations").insert([locationData]).select().single();

  if (error) throw error;
  return data;
}

/**
 * Actualizar ubicación
 */
export async function updateLocation(locationId: string, updates: Partial<Location>) {
  const { data, error } = await supabase.from("eye_exam_locations").update(updates).eq("id", locationId).select().single();

  if (error) throw error;
  return data;
}

/**
 * Verificar si una ubicación tiene citas asociadas
 */
export async function checkLocationHasAppointments(locationId: string): Promise<boolean> {
  const { data, error } = await supabase.from("eye_exam_appointments").select("id").eq("location_id", locationId).limit(1);

  if (error) throw error;
  return (data?.length || 0) > 0;
}

/**
 * Eliminar ubicación
 */
export async function deleteLocation(locationId: string) {
  const hasAppointments = await checkLocationHasAppointments(locationId);

  if (hasAppointments) {
    throw new Error("No se puede eliminar la ubicación porque tiene citas asociadas. Puedes desactivarla en su lugar.");
  }

  const { data, error } = await supabase.from("eye_exam_locations").delete().eq("id", locationId).select().single();

  if (error) {
    if (error.code === "23503") {
      throw new Error("No se puede eliminar la ubicación porque tiene citas asociadas. Puedes desactivarla en su lugar.");
    }
    throw error;
  }
  return data;
}
