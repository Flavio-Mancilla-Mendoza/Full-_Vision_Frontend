// src/services/admin/users.ts - Gestión de usuarios (Admin)
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Obtener todos los usuarios (solo admins)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, phone, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Admin Service: Error en consulta:", error);
      throw new Error(`Error al consultar usuarios: ${error.message} (Código: ${error.code || "N/A"})`);
    }

    return (data || []).map((user) => ({
      ...user,
      role: user.role as UserRole | null,
      email: user.email || null,
      full_name: user.full_name || null,
      phone: user.phone || null,
      is_active: user.is_active ?? false,
    })) as UserProfile[];
  } catch (error: unknown) {
    console.error("❌ Admin Service: Error crítico:", error);
    if (error instanceof Error) throw error;
    throw new Error("Error desconocido al consultar usuarios");
  }
}

/**
 * Obtener usuarios con paginación y filtros
 */
export async function getAllUsersPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string } = {}
): Promise<{ data: UserProfile[]; count: number; totalPages: number }> {
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, phone, is_active, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("Error fetching paginated users:", error);
    throw error;
  }

  return {
    data: (data || []).map((user) => ({
      ...user,
      role: user.role as UserRole | null,
      is_active: user.is_active ?? false,
    })) as UserProfile[],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Crear usuario (usa AWS Cognito Admin API a través de Lambda)
 */
export async function createUser(userData: {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "customer";
  phone?: string;
}) {
  try {
    const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;

    if (!apiUrl) {
      throw new Error("API Gateway URL no configurada");
    }

    const { getAccessToken } = await import("@/services/cognito-auth");
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("No se pudo obtener el token de acceso. Inicia sesión nuevamente.");
    }

    const response = await fetch(`${apiUrl}/admin/users/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: "createUser",
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
    }

    if (!result.success) {
      throw new Error(result.error || "Error desconocido al crear usuario");
    }

    // Crear el perfil en Supabase
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: result.userSub,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("❌ Error creando perfil en Supabase:", profileError);
    }

    return {
      success: true,
      user: profileData,
      message: "Usuario creado exitosamente",
    };
  } catch (error: unknown) {
    console.error("❌ Admin Service: Error creando usuario:", error);
    if (error instanceof Error) throw error;
    throw new Error("Error desconocido al crear usuario");
  }
}

/**
 * Actualizar usuario
 */
export async function updateUser(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();

  if (error) throw error;
  return data;
}

/**
 * Desactivar usuario
 */
export async function deactivateUser(userId: string) {
  const { data, error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId).select().single();

  if (error) throw error;
  return data;
}
