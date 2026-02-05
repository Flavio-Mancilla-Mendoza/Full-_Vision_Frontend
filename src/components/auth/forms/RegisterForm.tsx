// src/components/auth/forms/RegisterForm.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import type { AuthFormData, FormErrors } from "../hooks/useAuthValidation";

interface RegisterFormProps {
  formData: AuthFormData;
  errors: FormErrors;
  loading: boolean;
  onInputChange: (field: keyof AuthFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchMode: () => void;
}

export default function RegisterForm({
  formData,
  errors,
  loading,
  onInputChange,
  onSubmit,
  onSwitchMode,
}: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        id="fullName"
        label="Nombre completo"
        value={formData.fullName}
        onChange={(value) => onInputChange("fullName", value)}
        error={errors.fullName}
        placeholder="Tu nombre completo"
        autoComplete="name"
      />

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
        autoComplete="new-password"
        showHint
      />

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => onInputChange("confirmPassword", e.target.value)}
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-red-600">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <SubmitButton
        loading={loading}
        loadingText="Procesando..."
        text="Crear cuenta"
      />

      <div className="text-center">
        <Button type="button" variant="link" onClick={onSwitchMode} className="text-sm">
          ¿Ya tienes cuenta? Inicia sesión
        </Button>
      </div>
    </form>
  );
}
