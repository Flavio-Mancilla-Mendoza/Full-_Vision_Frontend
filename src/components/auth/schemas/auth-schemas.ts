// src/components/auth/schemas/auth-schemas.ts
import { z } from "zod";

// ── Shared validators ──────────────────────────────────────────────

const emailField = z
  .string()
  .min(1, "El correo es obligatorio")
  .email("Ingresa un correo válido");

const passwordField = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[a-z]/, "Debe incluir al menos una letra minúscula")
  .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número")
  .regex(/[^a-zA-Z0-9]/, "Debe incluir al menos un carácter especial");

const nameField = z
  .string()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .transform((v) => v.trim());

const verificationCodeField = z
  .string()
  .length(6, "El código debe tener 6 dígitos")
  .regex(/^\d{6}$/, "El código solo debe contener números");

// ── Form schemas ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const registerSchema = z
  .object({
    fullName: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  email: emailField,
  verificationCode: verificationCodeField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    verificationCode: verificationCodeField,
    newPassword: passwordField,
    confirmNewPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  });

export const newPasswordSchema = z
  .object({
    fullName: nameField,
    newPassword: passwordField,
    confirmNewPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  });

// ── Inferred types ─────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

export type AuthMode =
  | "login"
  | "register"
  | "confirm"
  | "newPassword"
  | "forgotPassword"
  | "resetPassword";

// ── Utility functions ──────────────────────────────────────────────

/**
 * Parsea un nombre completo en given_name y family_name
 */
export function parseFullName(fullName: string): {
  given_name: string;
  family_name: string;
  name: string;
} {
  const nameParts = fullName.trim().split(" ");
  const given_name = nameParts[0];
  const family_name = nameParts.slice(1).join(" ") || given_name;

  return {
    given_name,
    family_name,
    name: fullName.trim(),
  };
}

/**
 * Calcula la fortaleza de una contraseña (0–5)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: "8+ caracteres", passed: password.length >= 8 },
    { label: "Minúscula", passed: /[a-z]/.test(password) },
    { label: "Mayúscula", passed: /[A-Z]/.test(password) },
    { label: "Número", passed: /[0-9]/.test(password) },
    { label: "Carácter especial", passed: /[^a-zA-Z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.passed).length;

  const labels: Record<number, string> = {
    0: "",
    1: "Muy débil",
    2: "Débil",
    3: "Regular",
    4: "Fuerte",
    5: "Muy fuerte",
  };

  return { score, label: labels[score] ?? "", checks };
}
