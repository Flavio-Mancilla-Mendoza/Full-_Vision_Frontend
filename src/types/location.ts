// src/types/location.ts
// Tipos para ubicaciones de exámenes oculares
// Alineados con Database['public']['Tables']['eye_exam_locations']

import { Database } from "./database";

// Tipo derivado de la base de datos (fuente de verdad)
export type Location = Database["public"]["Tables"]["eye_exam_locations"]["Row"];
export type LocationInsert = Database["public"]["Tables"]["eye_exam_locations"]["Insert"];
export type LocationUpdate = Database["public"]["Tables"]["eye_exam_locations"]["Update"];

// Formulario para crear/editar una ubicación
// Todos los campos son requeridos en el UI aunque algunos sean nullable en DB
export interface LocationFormData {
  name: string;
  address: string;
  city: string;
  phone: string;
  is_active: boolean;
  business_hours: string;
}

/**
 * Convierte LocationFormData a LocationInsert para la base de datos
 */
export function toLocationInsert(form: LocationFormData): LocationInsert {
  return {
    name: form.name,
    address: form.address || null,
    city: form.city || null,
    phone: form.phone || null,
    is_active: form.is_active,
    // business_hours no existe en la tabla, se podría agregar después
  };
}
