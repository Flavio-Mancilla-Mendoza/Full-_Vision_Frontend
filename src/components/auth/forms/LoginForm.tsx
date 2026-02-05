// src/components/auth/forms/LoginForm.tsx
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import type { AuthFormData, FormErrors } from "../hooks/useAuthValidation";

interface LoginFormProps {
  formData: AuthFormData;
  errors: FormErrors;
  loading: boolean;
  onInputChange: (field: keyof AuthFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchMode: () => void;
}

export default function LoginForm({
  formData,
  errors,
  loading,
  onInputChange,
  onSubmit,
  onSwitchMode,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        id="email"
        label="Correo electrónico"
        type="email"
        value={formData.email}
        onChange={(value) => onInputChange("email", value)}
        error={errors.email}
        placeholder="tu@ejemplo.com"
        autoComplete="email"
      />

      <PasswordInput
        id="password"
        label="Contraseña"
        value={formData.password}
        onChange={(value) => onInputChange("password", value)}
        error={errors.password}
        autoComplete="current-password"
      />

      <SubmitButton
        loading={loading}
        loadingText="Procesando..."
        text="Iniciar sesión"
      />

      <div className="text-center">
        <Button type="button" variant="link" onClick={onSwitchMode} className="text-sm">
          ¿No tienes cuenta? Regístrate aquí
        </Button>
      </div>
    </form>
  );
}
