// src/hooks/auth/useAuthState.ts
/**
 * Hook interno que maneja el estado de autenticación
 * Centraliza el listener de Hub para evitar duplicación
 */

import { useEffect, useState, useCallback } from "react";
import { Hub } from "@aws-amplify/core";
import { getCurrentAuthSession, type User } from "@/services/cognito-auth";
import { getUserRole, type UserRole } from "./authUtils";

// Flag para debugging
const DEBUG = import.meta.env.DEV;

function debugLog(message: string, ...args: unknown[]) {
  if (DEBUG) {
    console.log(message, ...args);
  }
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
}

export interface AuthState {
  session: AuthSession | null;
  isAdmin: boolean;
  loading: boolean;
}

// ── Estado global compartido entre todas las instancias del hook ──
// Esto evita que N componentes usando useAuthState disparen N forceRefresh independientes.
let _globalHasValidated = false;
let _globalLoadPromise: Promise<void> | null = null;
const _globalListeners = new Set<(s: AuthState) => void>();
let _globalState: AuthState = { session: null, isAdmin: false, loading: true };
let _hubRegistered = false;

/**
 * Carga única de datos de autenticación (compartida entre instancias)
 * @param forceRefresh - Forzar refresh de tokens (ej: después de signIn/signOut)
 */
async function _sharedLoadAuthData(forceRefresh = false) {
  try {
    // Primera carga o si se pide explícitamente: forzar validación con Cognito
    const shouldForceRefresh = forceRefresh || !_globalHasValidated;
    const authSession = await getCurrentAuthSession(shouldForceRefresh);
    _globalHasValidated = true;

    if (!authSession?.user) {
      _broadcastState({ session: null, isAdmin: false, loading: false });
      return;
    }

    const role = await getUserRole(authSession.user.id);
    _broadcastState({
      session: authSession,
      isAdmin: role === "admin",
      loading: false,
    });
  } catch (error) {
    console.error("Error cargando datos de autenticación:", error);
    _broadcastState({ session: null, isAdmin: false, loading: false });
  }
}

/** Deduplicar llamadas concurrentes */
function _requestLoadAuthData(forceRefresh = false) {
  // Si se pide forceRefresh y ya hay una carga en curso (sin force), cancelar la deduplicación
  if (forceRefresh || !_globalLoadPromise) {
    _globalLoadPromise = _sharedLoadAuthData(forceRefresh).finally(() => {
      _globalLoadPromise = null;
    });
  }
  return _globalLoadPromise;
}

function _broadcastState(newState: AuthState) {
  _globalState = newState;
  _globalListeners.forEach((fn) => fn(newState));
}

/**
 * Hook principal de estado de autenticación
 * Todas las instancias comparten el mismo estado y una sola llamada a Cognito
 */
export function useAuthState(): AuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AuthState>(_globalState);

  useEffect(() => {
    // Suscribir esta instancia a actualizaciones globales
    _globalListeners.add(setState);

    // Solo la primera instancia registra el Hub listener y dispara la carga inicial
    if (!_hubRegistered) {
      _hubRegistered = true;

      _requestLoadAuthData();

      Hub.listen("auth", ({ payload }) => {
        switch (payload.event) {
          case "signedIn":
            debugLog("✅ Usuario inició sesión");
            _requestLoadAuthData(true);
            break;
          case "signedOut":
            debugLog("👋 Usuario cerró sesión");
            _globalHasValidated = false;
            _broadcastState({ session: null, isAdmin: false, loading: false });
            break;
          case "tokenRefresh":
            // No re-cargar aquí: el refresh ya fue disparado por nosotros mismos
            // o por Amplify automáticamente. Evita loop y rate-limit.
            debugLog("🔄 Token actualizado (no-op)");
            break;
          case "tokenRefresh_failure":
            debugLog("❌ Error actualizando token");
            _globalHasValidated = false;
            _broadcastState({ session: null, isAdmin: false, loading: false });
            break;
        }
      });
    } else {
      // Instancias posteriores reciben el estado actual inmediatamente
      setState(_globalState);
    }

    return () => {
      _globalListeners.delete(setState);
    };
  }, []);

  const refresh = useCallback(() => _requestLoadAuthData(), []);

  return {
    ...state,
    refresh,
  };
}
