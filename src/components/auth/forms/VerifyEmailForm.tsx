// src/components/auth/forms/VerifyEmailForm.tsx
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import type { AuthFormData, FormErrors } from "../hooks/useAuthValidation";

interface VerifyEmailFormProps {
  formData: AuthFormData;
  errors: FormErrors;
  loading: boolean;
  onInputChange: (field: keyof AuthFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResendCode: () => void;
  onBackToLogin: () => void;
}

export default function VerifyEmailForm({
  formData,
  errors,
  loading,
  onInputChange,
  onSubmit,
  onResendCode,
  onBackToLogin,
}: VerifyEmailFormProps) {
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
      />

      <FormField
        id="verificationCode"
        label="Código de verificación"
        value={formData.verificationCode}
        onChange={(value) => onInputChange("verificationCode", value)}
        error={errors.verificationCode}
        placeholder="123456"
        maxLength={6}
        hint="Ingresa el código de 6 dígitos que enviamos a tu correo"
      />

      <SubmitButton
        loading={loading}
        loadingText="Verificando..."
        text="Verificar cuenta"
      />

      <Button
        type="button"
        variant="outline"
        onClick={onResendCode}
        disabled={loading}
        className="w-full"
      >
        Reenviar código
      </Button>

      <div className="text-center">
        <Button type="button" variant="link" onClick={onBackToLogin} className="text-sm">
          Volver al inicio de sesión
        </Button>
      </div>
    </form>
  );
}
