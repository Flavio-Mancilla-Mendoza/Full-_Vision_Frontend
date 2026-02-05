// src/components/auth/hooks/useAuthValidation.ts
import { useState, useCallback } from "react";

export interface AuthFormData {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
  verificationCode: string;
  newPassword: string;
  confirmNewPassword: string;
  newPasswordFullName: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  confirmPassword?: string;
  verificationCode?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  newPasswordFullName?: string;
}

export type AuthMode = "login" | "register" | "confirm" | "newPassword";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida una contraseña según los requisitos de Cognito
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!/[a-z]/.test(password)) {
    return "Debe incluir al menos una letra minúscula";
  }
  if (!/[A-Z]/.test(password)) {
    return "Debe incluir al menos una letra mayúscula";
  }
  if (!/[0-9]/.test(password)) {
    return "Debe incluir al menos un número";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Debe incluir al menos un carácter especial";
  }
  return null;
}

/**
 * Valida un email
 */
export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email)) {
    return "Ingresa un correo válido";
  }
  return null;
}

/**
 * Valida un nombre
 */
export function validateName(name: string): string | null {
  if (name.trim().length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }
  return null;
}

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

export const initialFormData: AuthFormData = {
  email: "",
  password: "",
  fullName: "",
  confirmPassword: "",
  verificationCode: "",
  newPassword: "",
  confirmNewPassword: "",
  newPasswordFullName: "",
};

/**
 * Hook para manejar validación de formularios de autenticación
 */
export function useAuthValidation() {
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateLoginForm = useCallback((data: AuthFormData): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(data.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(data.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const validateRegisterForm = useCallback((data: AuthFormData): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(data.email);
    if (emailError) newErrors.email = emailError;

    const nameError = validateName(data.fullName);
    if (nameError) newErrors.fullName = nameError;

    const passwordError = validatePassword(data.password);
    if (passwordError) newErrors.password = passwordError;

    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const validateConfirmForm = useCallback((data: AuthFormData): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(data.email);
    if (emailError) newErrors.email = emailError;

    if (data.verificationCode.length !== 6) {
      newErrors.verificationCode = "El código debe tener 6 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const validateNewPasswordForm = useCallback((data: AuthFormData): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateName(data.newPasswordFullName);
    if (nameError) newErrors.newPasswordFullName = nameError;

    const passwordError = validatePassword(data.newPassword);
    if (passwordError) newErrors.newPassword = passwordError;

    if (data.newPassword !== data.confirmNewPassword) {
      newErrors.confirmNewPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const validate = useCallback(
    (mode: AuthMode, data: AuthFormData): boolean => {
      switch (mode) {
        case "login":
          return validateLoginForm(data);
        case "register":
          return validateRegisterForm(data);
        case "confirm":
          return validateConfirmForm(data);
        case "newPassword":
          return validateNewPasswordForm(data);
        default:
          return false;
      }
    },
    [validateLoginForm, validateRegisterForm, validateConfirmForm, validateNewPasswordForm]
  );

  return {
    errors,
    clearError,
    clearAllErrors,
    validate,
    setErrors,
  };
}
