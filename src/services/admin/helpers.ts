// src/services/admin/helpers.ts - Funciones auxiliares compartidas

/**
 * Parsear fechas en diferentes formatos (DD-MM-YYYY, YYYY-MM-DD, ISO)
 */
export function parseDateInput(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string" || dateString.trim() === "") {
    return null;
  }

  const trimmed = dateString.trim();

  // Try explicit formats FIRST to avoid ambiguous US-style parsing from new Date()
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

  // Fallback: ISO strings and other formats
  const directParse = new Date(trimmed);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  return null;
}

/**
 * Obtener token de autenticación de Cognito.
 * Throws if no token available instead of returning null.
 */
export async function getAuthToken(): Promise<string> {
  try {
    const { fetchAuthSession } = await import("@aws-amplify/auth");
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString() || null;
    if (!token) {
      throw new Error("No hay sesión activa. Inicia sesión nuevamente.");
    }
    return token;
  } catch (error) {
    if (error instanceof Error && error.message.includes("sesión")) throw error;
    console.error("Error getting auth token:", error);
    throw new Error("No se pudo obtener el token de autenticación. Inicia sesión nuevamente.");
  }
}

/**
 * Verificar si el usuario actual es admin (via JWT cognito:groups)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { fetchAuthSession } = await import("@aws-amplify/auth");
    const session = await fetchAuthSession();
    const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || [];
    return groups.includes("admin") || groups.includes("Admins");
  } catch {
    return false;
  }
}
