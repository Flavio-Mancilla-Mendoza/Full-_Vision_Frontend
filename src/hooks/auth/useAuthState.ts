// src/hooks/auth/useAuthState.ts
/**
 * Hook interno que maneja el estado de autenticación
 * Centraliza el listener de Hub para evitar duplicación
 */

import { useEffect, useState, useCallback } from "react";
import { Hub } from "@aws-amplify/core";
import { getCurrentAuthSession, isAuthenticated, type User } from "@/services/cognito-auth";
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

/**
 * Hook principal de estado de autenticación
 * Usa un único listener de Hub para todos los eventos
 */
export function useAuthState(): AuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAdmin: false,
    loading: true,
  });

  const loadAuthData = useCallback(async () => {
    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        setState({ session: null, isAdmin: false, loading: false });
        return;
      }

      const authSession = await getCurrentAuthSession();

      if (!authSession?.user) {
        setState({ session: null, isAdmin: false, loading: false });
        return;
      }

      const role = await getUserRole(authSession.user.id);

      setState({
        session: authSession,
        isAdmin: role === "admin",
        loading: false,
      });
    } catch (error) {
      console.error("Error cargando datos de autenticación:", error);
      setState({ session: null, isAdmin: false, loading: false });
    }
  }, []);

  useEffect(() => {
    // Cargar datos inicial
    loadAuthData();

    // Único listener de Hub para todos los eventos de auth
    const hubListener = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          debugLog("✅ Usuario inició sesión");
          loadAuthData();
          break;
        case "signedOut":
          debugLog("👋 Usuario cerró sesión");
          setState({ session: null, isAdmin: false, loading: false });
          break;
        case "tokenRefresh":
          debugLog("🔄 Token actualizado");
          loadAuthData();
          break;
        case "tokenRefresh_failure":
          debugLog("❌ Error actualizando token");
          setState({ session: null, isAdmin: false, loading: false });
          break;
      }
    });

    return () => {
      hubListener();
    };
  }, [loadAuthData]);

  return {
    ...state,
    refresh: loadAuthData,
  };
}
