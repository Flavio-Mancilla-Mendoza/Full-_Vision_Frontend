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

/**
 * Obtiene el perfil completo del usuario
 * Combina datos de Cognito con rol
 */
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentAuthUser();

    if (!user) {
      return null;
    }

    const role = await getUserRole(user.id);

    return {
      id: user.id,
      full_name: user.name || user.email.split("@")[0],
      email: user.email,
      role,
      phone: user.attributes?.phone_number,
      address: user.attributes?.address,
      email_verified: user.emailVerified,
    };
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
}
