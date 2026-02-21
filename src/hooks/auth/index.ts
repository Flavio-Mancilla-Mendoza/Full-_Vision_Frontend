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

import { useEffect, useState, useCallback } from "react";
import { useAuthState, type AuthSession, type AuthState } from "./useAuthState";
import { getProfile, refreshProfile as refreshProfileUtil, clearProfileCache, type UserProfile, type UserRole } from "./authUtils";

// Re-exportar tipos
export type { AuthSession, AuthState, UserProfile, UserRole };

// ── Global profile state (shared across all useUser instances) ──
let _globalProfile: UserProfile | null = null;
let _globalProfileLoading = true;
let _globalProfilePromise: Promise<void> | null = null;
const _profileListeners = new Set<(p: { user: UserProfile | null; loading: boolean }) => void>();

function _broadcastProfile(user: UserProfile | null, loading: boolean) {
  _globalProfile = user;
  _globalProfileLoading = loading;
  _profileListeners.forEach((fn) => fn({ user, loading }));
}

async function _loadGlobalProfile() {
  if (_globalProfilePromise) return _globalProfilePromise;
  _globalProfilePromise = (async () => {
    try {
      const profile = await getProfile();
      _broadcastProfile(profile, false);
    } catch {
      _broadcastProfile(null, false);
    } finally {
      _globalProfilePromise = null;
    }
  })();
  return _globalProfilePromise;
}

/** Reset profile state on sign out */
export function resetProfileState() {
  clearProfileCache();
  _globalProfile = null;
  _globalProfileLoading = true;
  _globalProfilePromise = null;
  _broadcastProfile(null, false);
}

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
 * OPTIMIZADO: Todas las instancias comparten UN solo profile load (sin llamadas duplicadas a Cognito)
 */
export function useUser() {
  const { session, isAdmin, loading: authLoading, refresh } = useAuthState();
  const [profileState, setProfileState] = useState<{ user: UserProfile | null; loading: boolean }>({
    user: _globalProfile,
    loading: _globalProfileLoading,
  });

  useEffect(() => {
    // Suscribir a actualizaciones del perfil global
    _profileListeners.add(setProfileState);

    if (!authLoading && session?.user) {
      // Cargar perfil solo si el global no está cargado aún
      if (_globalProfileLoading && !_globalProfilePromise) {
        _loadGlobalProfile();
      }
    } else if (!authLoading && !session?.user) {
      // No hay sesión → limpiar perfil
      _broadcastProfile(null, false);
    }

    return () => {
      _profileListeners.delete(setProfileState);
    };
  }, [session, authLoading]);

  const refreshProfileFn = useCallback(async () => {
    clearProfileCache();
    _globalProfilePromise = null;
    _broadcastProfile(null, true);
    await _loadGlobalProfile();
  }, []);

  return {
    user: profileState.user,
    loading: authLoading || profileState.loading,
    isAuthenticated: !!session?.user,
    isAdmin,
    session,
    refreshProfile: refreshProfileFn,
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
