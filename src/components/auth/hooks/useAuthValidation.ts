// src/components/auth/hooks/useAuthValidation.ts
// DEPRECATED: This file is kept for backward compatibility.
// All validation now uses Zod schemas in ../schemas/auth-schemas.ts
// with react-hook-form + @hookform/resolvers/zod.

export {
  type AuthMode,
  type LoginFormData,
  type RegisterFormData,
  type VerifyEmailFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  type NewPasswordFormData,
  parseFullName,
  getPasswordStrength,
} from "../schemas/auth-schemas";

