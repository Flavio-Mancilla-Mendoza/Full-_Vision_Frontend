// src/services/admin/helpers.ts - Funciones auxiliares compartidas
import { supabase } from "@/lib/supabase";

/**
 * Parsear fechas en diferentes formatos (DD-MM-YYYY, YYYY-MM-DD, ISO)
 */
export function parseDateInput(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string" || dateString.trim() === "") {
    return null;
  }

  const trimmed = dateString.trim();

  // Intentar parsear directamente con new Date() primero
  const directParse = new Date(trimmed);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  // Si ya está en formato YYYY-MM-DD o ISO, intentar parsear directamente
  if (trimmed.includes("-")) {
    // Verificar si es DD-MM-YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return null;
      }

      return new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    }

    // Verificar si es YYYY-MM-DD
    const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return null;
      }

      return new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    }
  }

  return null;
}

/**
 * Obtener token de autenticación de Cognito
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import("@aws-amplify/auth");
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Verificar si el usuario actual es admin
 */
export async function isAdmin(): Promise<boolean> {
  const { getCurrentUserId } = await import("@/services/cognito-auth");
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();

  return profile?.role === "admin";
}
