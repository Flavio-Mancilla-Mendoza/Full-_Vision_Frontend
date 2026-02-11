// src/services/admin/users.ts - Gestión de usuarios (Admin) via API Gateway
import { adminProfilesApi } from "@/services/api";
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
    const data = await adminProfilesApi.list();

    return (data || []).map((user) => ({
      ...user,
      role: (user.role as UserRole) || null,
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
 * Obtener usuarios con paginación y filtros (client-side filtering)
 */
export async function getAllUsersPaginated(
  page = 1,
  limit = 50,
  filters: { search?: string } = {}
): Promise<{ data: UserProfile[]; count: number; totalPages: number }> {
  const allUsers = await getAllUsers();
  let filtered = allUsers;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q)
    );
  }

  const count = filtered.length;
  const totalPages = Math.ceil(count / limit);
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return { data: paged, count, totalPages };
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

    // Crear el perfil via API Gateway (Lambda → Supabase SERVICE_ROLE)
    let profileData = null;
    try {
      profileData = await adminProfilesApi.create({
        id: result.userSub,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        is_active: true,
      });
    } catch (profileError) {
      console.error("❌ Error creando perfil via API:", profileError);
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
  const data = await adminProfilesApi.update(userId, updates);

  return {
    success: true,
    user: data,
    message: "Usuario actualizado exitosamente",
  };
}

/**
 * Desactivar usuario
 */
export async function deactivateUser(userId: string) {
  const data = await adminProfilesApi.update(userId, { is_active: false });
  return data;
}
