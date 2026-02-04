export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "customer";
  phone?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: "admin" | "customer";
  phone?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "El email es requerido";
  if (!emailRegex.test(email)) return "Formato de email inválido";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es requerida";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/(?=.*[a-z])/.test(password)) return "La contraseña debe contener al menos una letra minúscula";
  if (!/(?=.*[A-Z])/.test(password)) return "La contraseña debe contener al menos una letra mayúscula";
  if (!/(?=.*\d)/.test(password)) return "La contraseña debe contener al menos un número";
  return null;
}

export function validateUserForm(
  formData: CreateUserData | UpdateUserData,
  existingEmails: string[] = [],
  isCreate = true,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (isCreate) {
    const createData = formData as CreateUserData;
    const emailError = validateEmail(createData.email || "");
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(createData.password || "");
    if (passwordError) errors.password = passwordError;

    if (createData.email && !emailError) {
      const emailExists = existingEmails.includes(createData.email);
      if (emailExists) errors.email = "Este email ya está registrado";
    }
  }

  if (!formData.full_name || !formData.full_name.toString().trim()) {
    errors.full_name = "El nombre completo es requerido";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
