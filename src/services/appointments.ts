// src/services/appointments.ts
import { supabase } from "@/lib/supabase";
import { getCurrentUserId, getCurrentAuthUser } from "@/services/cognito-auth";
import * as api from "@/services/api";
import { fetchAuthSession } from "@aws-amplify/auth";
import type { UserAppointment, CalendarAppointment, AppointmentStatus } from "@/types/appointments";
import type { Database } from "@/types/database";

type DbLocation = Database["public"]["Tables"]["eye_exam_locations"]["Row"];
type DbAppointment = Database["public"]["Tables"]["eye_exam_appointments"]["Row"];
type DbAppointmentWithLocation = DbAppointment & {
  eye_exam_locations: DbLocation | null;
};

// Función para mapear status de base de datos a UserAppointment
function mapDatabaseStatusToUserStatus(dbStatus: DbAppointment["status"]): UserAppointment["status"] {
  switch (dbStatus) {
    case "scheduled":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "confirmed"; // Mapear in_progress a confirmed para la UI
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export async function listLocations(): Promise<DbLocation[]> {
  try {
    const { data, error } = await supabase
      .from("eye_exam_locations")
      .select("id, name, address, city, phone, email")
      .eq("is_active", true) // Solo locaciones activas
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading locations:", error);
      // Si la tabla no existe o no hay permisos, devolver datos por defecto
      if (error.code === "42P01" || error.code === "42501") {
        return [
          {
            id: "default-location",
            name: "Full Vision - Centro",
            address: "Av. Principal 123",
            city: "Lima",
            phone: "(01) 234-5678",
            email: "citas@fullvision.com",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
      throw error;
    }

    // Convertir los datos de Supabase al tipo DbLocation
    const locations: DbLocation[] = (data || []).map((location: DbLocation) => ({
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      phone: location.phone,
      email: location.email,
      is_active: location.is_active,
      created_at: location.created_at,
      updated_at: location.updated_at,
    }));

    return locations;
  } catch (error) {
    console.error("Error in listLocations:", error);
    throw new Error("No se pudieron cargar las ubicaciones disponibles");
  }
}

export async function createAppointment(locationId: string, iso: string, notes?: string) {
  if (api.USE_PROXY_API) {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("Debes iniciar sesión para agendar una cita");

      const response = await fetch(`${api.getApiUrl()}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ iso: iso, locationId, notes }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating appointment via API:", error);
      if (error instanceof Error) throw error;
      throw new Error("Error inesperado al crear la cita");
    }
  }

  // Legacy direct Supabase path
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Debes iniciar sesión para agendar una cita");

    // Obtener información del usuario de Cognito
    const user = await getCurrentAuthUser();
    const userName = user?.name || user?.email || "Sin nombre";
    const userEmail = user?.email || "";

    // Convertir ISO string a fecha y hora separadas
    const appointmentDateTime = new Date(iso);
    const appointmentDate = appointmentDateTime.toISOString().split("T")[0]; // YYYY-MM-DD
    const appointmentTime = appointmentDateTime.toTimeString().split(" ")[0]; // HH:MM:SS

    const { data, error } = await supabase
      .from("eye_exam_appointments")
      .insert([
        {
          user_id: userId,
          location_id: locationId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes: notes || "",
          status: "scheduled",
          patient_name: userName,
          patient_email: userEmail,
          exam_type: "routine",
          duration_minutes: 60,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating appointment:", error);

      // Manejo específico de errores comunes
      if (error.code === "42P01") {
        throw new Error("El sistema de citas no está configurado. Contacta al administrador.");
      }
      if (error.code === "42501") {
        throw new Error("No tienes permisos para crear citas. Verifica tu sesión.");
      }
      if (error.code === "23503") {
        throw new Error("La ubicación seleccionada no es válida.");
      }

      throw new Error("No se pudo crear la cita. Inténtalo nuevamente.");
    }

    return data;
  } catch (error) {
    console.error("Error in createAppointment:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error inesperado al crear la cita");
  }
}

export async function listAppointmentsAll(): Promise<CalendarAppointment[]> {
  if (api.USE_PROXY_API) {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("Authentication required");

      const res = await fetch(`${api.getApiUrl()}/appointments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      return (json || []).map((appointment: any) => ({ ...appointment, status: appointment.status })) as CalendarAppointment[];
    } catch (error) {
      console.error("Error listing appointments via API:", error);
      throw error;
    }
  }

  // Legacy direct Supabase
  // Requiere rol admin por policy
  const { data, error } = await supabase
    .from("eye_exam_appointments")
    .select(
      `
      *,
      eye_exam_locations ( id, name, address, city, phone )
    `,
    )
    .order("appointment_date", { ascending: true });

  if (error) throw error;
  return (data || []).map((appointment) => ({
    ...appointment,
    status: appointment.status as AppointmentStatus,
  })) as CalendarAppointment[];
}

export async function confirmAppointment(id: string) {
  if (api.USE_PROXY_API) {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("Authentication required");

      const res = await fetch(`${api.getApiUrl()}/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "confirmed" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Error confirming appointment via API:", error);
      throw error;
    }
  }

  const { data, error } = await supabase.from("eye_exam_appointments").update({ status: "confirmed" }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function listUserAppointments(): Promise<UserAppointment[]> {
  try {
    if (api.USE_PROXY_API) {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) throw new Error("Debes iniciar sesión para ver tus citas");

        const res = await fetch(`${api.getApiUrl()}/appointments/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return (json || []).map((appointment: any) => ({ ...appointment, status: mapDatabaseStatusToUserStatus(appointment.status) }));
      } catch (error) {
        console.error("Error listing user appointments via API:", error);
        throw error;
      }
    }

    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Debes iniciar sesión para ver tus citas");

    const { data, error } = await supabase
      .from("eye_exam_appointments")
      .select(
        `
        *,
        eye_exam_locations ( id, name, address, city, phone )
      `,
      )
      .eq("user_id", userId)
      .order("appointment_date", { ascending: true });

    if (error) {
      console.error("Error loading user appointments:", error);
      throw error;
    }

    // Convertir los datos de Supabase al tipo UserAppointment
    const appointments: UserAppointment[] = (data || []).map((appointment: DbAppointmentWithLocation) => ({
      ...appointment,
      status: mapDatabaseStatusToUserStatus(appointment.status),
    }));

    return appointments;
  } catch (error) {
    console.error("Error in listUserAppointments:", error);
    throw new Error("No se pudieron cargar tus citas");
  }
}

export async function cancelAppointment(id: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Debes iniciar sesión para cancelar una cita");

    const { data, error } = await supabase
      .from("eye_exam_appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", userId) // Solo puede cancelar sus propias citas
      .select()
      .single();

    if (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in cancelAppointment:", error);
    throw new Error("No se pudo cancelar la cita");
  }
}
