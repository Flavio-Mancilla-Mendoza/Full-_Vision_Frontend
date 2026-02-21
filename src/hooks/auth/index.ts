// src/hooks/auth/index.ts
/**
 * Hooks de autenticación con AWS Cognito
 * 
 * Uso:
 *   import { useAuth, useUser } from "@/hooks/auth";
 * 
 * Hooks disponibles:
 *   - useAuth(): Estado principal de autenticación
 *   - useUser(): Perfil completo del usuario (compatible con API anterior)
 *   - useIsAdmin(): Solo verifica si es admin
 */

import { useEffect, useState } from "react";
import { useAuthState, type AuthSession, type AuthState } from "./useAuthState";
import { getProfile, type UserProfile, type UserRole } from "./authUtils";

// Re-exportar tipos
export type { AuthSession, AuthState, UserProfile, UserRole };

/**
 * Hook principal de autenticación
 * Proporciona usuario, sesión, y estado de admin
 */
export function useAuth() {
  const { session, isAdmin, loading, refresh } = useAuthState();

  return {
    user: session?.user || null,
    session,
    loading,
    isAuthenticated: !!session?.user,
    isAdmin,
    refresh,
  };
}

/**
 * Hook para verificar si el usuario es admin
 * Útil para guards de rutas
 */
export function useIsAdmin() {
  const { isAdmin, loading } = useAuthState();
  return { isAdmin, loading };
}

/**
 * Hook compatible con la API anterior de Supabase
 * Proporciona perfil completo con datos adicionales
 */
export function useUser() {
  const { session, isAdmin, loading: authLoading, refresh } = useAuthState();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserProfile() {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (error) {
        console.error("Error cargando perfil de usuario:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadUserProfile();
    }
  }, [session, authLoading]);

  const refreshProfile = async () => {
    if (session?.user) {
      const profile = await getProfile();
      setUser(profile);
    }
  };

  return {
    user,
    loading: authLoading || loading,
    isAuthenticated: !!session?.user,
    isAdmin,
    session,
    refreshProfile,
    refresh,
  };
}

/**
 * Hook para obtener solo la sesión (sin perfil extendido)
 * Más ligero que useUser
 */
export function useSession() {
  const { session, loading } = useAuthState();
  return { session, loading };
}
