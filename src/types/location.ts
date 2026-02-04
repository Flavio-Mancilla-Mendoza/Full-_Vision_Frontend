// Formulario para crear/editar una ubicación (Location)
// Se separa de la interfaz Location para evitar campos de solo lectura como id, created_at, updated_at
export interface LocationFormData {
  name: string;
  address: string;
  city: string;
  phone: string;
  is_active: boolean;
  business_hours: string;
}

// Interfaz completa de ubicación usada en la API / servicios
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  business_hours?: string;
  created_at: string;
  updated_at: string;
}
