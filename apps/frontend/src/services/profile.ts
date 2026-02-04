/**
 * Profile Service - API Gateway Integration
 * Este servicio maneja el perfil del usuario a través del API Gateway
 */

import { profileApi, Profile } from "./api";

/**
 * Obtener el perfil del usuario actual
 */
export async function getProfile(): Promise<Profile> {
  return await profileApi.get();
}

/**
 * Actualizar el perfil del usuario actual
 */
export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return await profileApi.update(data);
}

/**
 * Actualizar dirección del usuario
 */
export async function updateAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}): Promise<Profile> {
  return await profileApi.update({ address });
}

/**
 * Actualizar teléfono del usuario
 */
export async function updatePhone(phone: string): Promise<Profile> {
  return await profileApi.update({ phone });
}

/**
 * Verificar si el usuario es admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const profile = await profileApi.get();
    return profile.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Re-export types from api.ts
export type { Profile } from "./api";
