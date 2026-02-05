/**
 * Appointments Service - Cliente para API Gateway + Cognito
 * Maneja las citas de exámenes oftalmológicos
 */

import { getApiUrl } from "@/services/api";
import { fetchAuthSession } from "@aws-amplify/auth";
import type { UserAppointment, CalendarAppointment, AppointmentStatus } from "@/types/appointments";
import type { Database } from "@/types/database";

// ================================================================
// Types
// ================================================================

type DbLocation = Database["public"]["Tables"]["eye_exam_locations"]["Row"];
type DbAppointment = Database["public"]["Tables"]["eye_exam_appointments"]["Row"];

interface CreateAppointmentPayload {
  locationId: string;
  iso: string;
  notes?: string;
}

// ================================================================
// Helper Functions
// ================================================================

/**
 * Obtener JWT token de Cognito para autenticación
 */
async function getAuthToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("Debes iniciar sesión para realizar esta acción");
  }
  return token;
}

/**
 * Hacer request autenticado a API Gateway
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Hacer request público a API Gateway (sin autenticación)
 */
async function apiRequestPublic<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${getApiUrl()}${endpoint}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Mapear status de base de datos a status de UI
 */
function mapDatabaseStatusToUserStatus(
  dbStatus: DbAppointment["status"]
): UserAppointment["status"] {
  const statusMap: Record<DbAppointment["status"], UserAppointment["status"]> = {
    scheduled: "pending",
    confirmed: "confirmed",
    in_progress: "confirmed",
    completed: "completed",
    cancelled: "cancelled",
  };
  return statusMap[dbStatus] ?? "pending";
}

// ================================================================
// Locations API
// ================================================================

/**
 * Listar ubicaciones activas (público - no requiere autenticación)
 */
export async function listLocations(): Promise<DbLocation[]> {
  try {
    return await apiRequestPublic<DbLocation[]>("/public/locations");
  } catch (error) {
    console.error("Error loading locations:", error);
    // Fallback: ubicación por defecto
    return [{
      id: "default-location",
      name: "Full Vision - Centro",
      address: "Av. Principal 123",
      city: "Lima",
      phone: "(01) 234-5678",
      email: "citas@fullvision.com",
      business_hours: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }];
  }
}

// ================================================================
// Appointments API
// ================================================================

export const appointmentsApi = {
  /**
   * Crear una nueva cita (requiere autenticación)
   */
  create: async (payload: CreateAppointmentPayload): Promise<DbAppointment> => {
    return apiRequest<DbAppointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Listar todas las citas (admin - requiere autenticación)
   */
  listAll: async (): Promise<CalendarAppointment[]> => {
    const data = await apiRequest<CalendarAppointment[]>("/appointments");
    return data.map((appointment) => ({
      ...appointment,
      status: appointment.status as AppointmentStatus,
    }));
  },

  /**
   * Listar citas del usuario actual (requiere autenticación)
   */
  listUser: async (): Promise<UserAppointment[]> => {
    const data = await apiRequest<DbAppointment[]>("/appointments/user");
    return data.map((appointment) => ({
      ...appointment,
      status: mapDatabaseStatusToUserStatus(appointment.status),
    }));
  },

  /**
   * Confirmar una cita (admin - requiere autenticación)
   */
  confirm: async (id: string): Promise<DbAppointment> => {
    return apiRequest<DbAppointment>(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "confirmed" }),
    });
  },

  /**
   * Cancelar una cita (requiere autenticación)
   */
  cancel: async (id: string): Promise<DbAppointment> => {
    return apiRequest<DbAppointment>(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    });
  },
};

// ================================================================
// Default Export
// ================================================================

export default {
  locations: { list: listLocations },
  appointments: appointmentsApi,
};
