// src/components/auth/forms/NewPasswordForm.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import type { AuthFormData, FormErrors } from "../hooks/useAuthValidation";

interface NewPasswordFormProps {
  formData: AuthFormData;
  errors: FormErrors;
  loading: boolean;
  onInputChange: (field: keyof AuthFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function NewPasswordForm({
  formData,
  errors,
  loading,
  onInputChange,
  onSubmit,
}: NewPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Contraseña temporal detectada.</strong> Por seguridad, debes
          establecer una nueva contraseña permanente antes de continuar.
        </p>
      </div>

      <FormField
        id="newPasswordFullName"
        label="Nombre completo"
        value={formData.newPasswordFullName}
        onChange={(value) => onInputChange("newPasswordFullName", value)}
        error={errors.newPasswordFullName}
        placeholder="Tu nombre completo"
        autoComplete="name"
      />

      <PasswordInput
        id="newPassword"
        label="Nueva contraseña"
        value={formData.newPassword}
        onChange={(value) => onInputChange("newPassword", value)}
        error={errors.newPassword}
        autoComplete="new-password"
        showHint
      />

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Confirmar nueva contraseña</Label>
        <Input
          id="confirmNewPassword"
          type="password"
          value={formData.confirmNewPassword}
          onChange={(e) => onInputChange("confirmNewPassword", e.target.value)}
          placeholder="Repite tu nueva contraseña"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmNewPassword}
          aria-describedby={errors.confirmNewPassword ? "confirmNewPassword-error" : undefined}
        />
        {errors.confirmNewPassword && (
          <p id="confirmNewPassword-error" className="text-sm text-red-600">
            {errors.confirmNewPassword}
          </p>
        )}
      </div>

      <SubmitButton
        loading={loading}
        loadingText="Actualizando..."
        text="Establecer contraseña e iniciar sesión"
      />
    </form>
  );
}
