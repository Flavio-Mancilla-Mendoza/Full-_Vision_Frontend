// src/hooks/auth/authUtils.ts
/**
 * Utilidades de autenticación para Cognito
 * Funciones puras sin estado de React
 */

import { fetchAuthSession } from "@aws-amplify/auth";
import { getCurrentAuthUser } from "@/services/cognito-auth";

export type UserRole = "admin" | "customer";

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  email?: string;
  phone?: string;
  address?: string;
  email_verified?: boolean;
}

/**
 * Obtiene el rol del usuario desde los grupos de Cognito
 * Los grupos se almacenan en el token JWT
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const session = await fetchAuthSession();
    const groups = session.tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined;

    if (groups?.includes("Admins")) {
      return "admin";
    }

    return "customer";
  } catch (error) {
    console.error("Error obteniendo rol:", error);
    return "customer";
  }
}

// ── Cache global del perfil para evitar llamadas duplicadas a Cognito ──
let _cachedProfile: UserProfile | null = null;
let _profileLoadPromise: Promise<UserProfile | null> | null = null;
let _profileUserId: string | null = null;

/**
 * Obtiene el perfil completo del usuario (con cache global)
 * Combina datos de Cognito con rol
 * Múltiples llamadas concurrentes solo disparan UNA petición a Cognito
 */
export async function getProfile(): Promise<UserProfile | null> {
  // Si hay un promise en curso, reusar (deduplicación)
  if (_profileLoadPromise) {
    return _profileLoadPromise;
  }

  _profileLoadPromise = _loadProfile();
  try {
    return await _profileLoadPromise;
  } finally {
    _profileLoadPromise = null;
  }
}

async function _loadProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentAuthUser();

    if (!user) {
      _cachedProfile = null;
      _profileUserId = null;
      return null;
    }

    // Si ya tenemos el perfil cacheado para este usuario, retornarlo
    if (_cachedProfile && _profileUserId === user.id) {
      return _cachedProfile;
    }

    const role = await getUserRole(user.id);

    _cachedProfile = {
      id: user.id,
      full_name: user.name || user.email.split("@")[0],
      email: user.email,
      role,
      phone: user.attributes?.phone_number,
      address: user.attributes?.address,
      email_verified: user.emailVerified,
    };
    _profileUserId = user.id;

    return _cachedProfile;
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
}

/** Limpia el cache del perfil (llamar en signOut o cuando se necesita refrescar) */
export function clearProfileCache() {
  _cachedProfile = null;
  _profileUserId = null;
  _profileLoadPromise = null;
}

/** Fuerza la recarga del perfil (bypass cache) */
export async function refreshProfile(): Promise<UserProfile | null> {
  clearProfileCache();
  return getProfile();
}
