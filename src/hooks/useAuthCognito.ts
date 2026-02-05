/**
 * Hook de autenticación con AWS Cognito
 * 
 * ⚠️ DEPRECADO: Usar imports desde "@/hooks/auth" directamente
 * Este archivo se mantiene por compatibilidad con código existente
 * 
 * Ejemplo de migración:
 *   // Antes
 *   import { useAuth } from "@/hooks/useAuthCognito";
 *   
 *   // Después
 *   import { useAuth } from "@/hooks/auth";
 */

// Re-exportar todo desde el nuevo módulo
export { useAuth, useUser, useSession, useIsAdmin } from "./auth";
export type { AuthSession, AuthState, UserProfile, UserRole } from "./auth";

// Re-exportar getProfile para compatibilidad
export { getProfile } from "./auth/authUtils";

