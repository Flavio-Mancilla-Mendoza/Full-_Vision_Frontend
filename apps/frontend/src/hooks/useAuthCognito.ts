/**
 * Hook de autenticación con AWS Cognito
 * Reemplaza la implementación de Supabase
 */
import { useEffect, useState } from "react";
import { getCurrentAuthUser, getCurrentAuthSession, isAuthenticated, type User } from "@/services/cognito-auth";
import { fetchAuthSession } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";

// Flag para debugging
const DEBUG = import.meta.env.DEV;

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
}

/**
 * Hook para obtener la sesión actual del usuario
 */
export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión inicial
    loadSession();

    // Escuchar cambios de autenticación
    const hubListener = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          console.log("✅ Usuario inició sesión");
          loadSession();
          break;
        case "signedOut":
          console.log("👋 Usuario cerró sesión");
          setSession(null);
          setLoading(false);
          break;
        case "tokenRefresh":
          console.log("🔄 Token actualizado");
          loadSession();
          break;
        case "tokenRefresh_failure":
          console.error("❌ Error actualizando token");
          setSession(null);
          setLoading(false);
          break;
        default:
          break;
      }
    });

    return () => {
      hubListener();
    };
  }, []);

  async function loadSession() {
    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        setSession(null);
        setLoading(false);
        return;
      }

      const authSession = await getCurrentAuthSession();
      setSession(authSession);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando sesión:", error);
      setSession(null);
      setLoading(false);
    }
  }

  return { session, loading };
}

/**
 * Hook para obtener el usuario actual con rol verificado
 */
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos inicial
    loadAuthData();

    // Escuchar cambios de autenticación
    const hubListener = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          console.log("✅ Usuario inició sesión");
          loadAuthData();
          break;
        case "signedOut":
          console.log("👋 Usuario cerró sesión");
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
          break;
        case "tokenRefresh":
          console.log("🔄 Token actualizado");
          loadAuthData();
          break;
        case "tokenRefresh_failure":
          console.error("❌ Error actualizando token");
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
          break;
        default:
          break;
      }
    });

    return () => {
      hubListener();
    };
  }, []);

  async function loadAuthData() {
    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Obtener sesión
      const authSession = await getCurrentAuthSession();

      if (!authSession?.user) {
        setSession(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setSession(authSession);

      // Verificar rol de admin
      const role = await getUserRole(authSession.user.id);
      const adminStatus = role === "admin";

      setIsAdmin(adminStatus);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando datos de autenticación:", error);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
    }
  }

  return {
    user: session?.user || null,
    session,
    loading,
    isAuthenticated: !!session?.user,
    isAdmin,
  };
}

/**
 * Obtener perfil del usuario (pendiente de implementar con backend)
 * Por ahora devuelve datos básicos de Cognito
 */
export async function getProfile() {
  try {
    const user = await getCurrentAuthUser();

    if (!user) {
      return null;
    }

    // Mapear atributos de Cognito a formato de perfil
    return {
      id: user.id,
      full_name: user.name || user.email.split("@")[0],
      email: user.email,
      role: await getUserRole(user.id),
      phone: user.attributes?.phone_number,
      address: user.attributes?.address,
      email_verified: user.emailVerified,
    };
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
}

/**
 * Obtener rol del usuario desde grupos de Cognito
 */
async function getUserRole(userId: string): Promise<"admin" | "customer"> {
  try {
    const session = await fetchAuthSession();
    const groups = session.tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined;

    if (groups && groups.includes("Admins")) {
      return "admin";
    }

    return "customer";
  } catch (error) {
    console.error("Error obteniendo rol:", error);
    return "customer";
  }
}

/**
 * Hook para verificar si el usuario es administrador
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const role = await getUserRole(user.id);
        setIsAdmin(role === "admin");
      } catch (error) {
        console.error("Error verificando admin:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}

/**
 * Hook compatible con la API anterior de useUser (Supabase)
 * Facilita la migración sin cambiar todos los archivos a la vez
 */
export interface UserProfile {
  id: string;
  full_name: string | null;
  role: "admin" | "customer";
  email?: string;
  phone?: string;
  address?: string;
  email_verified?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { session, loading } = useSession();

  useEffect(() => {
    async function loadUserProfile() {
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        console.error("Error cargando perfil de usuario:", error);
        setUser(null);
        setIsAdmin(false);
      }
    }

    loadUserProfile();
  }, [session]);

  const refreshProfile = async () => {
    if (session?.user) {
      const profile = await getProfile();
      setUser(profile);
      setIsAdmin(profile?.role === "admin");
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!session,
    isAdmin,
    session,
    refreshProfile,
  };
}
