// src/components/auth/forms/ResetPasswordForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import { resetPasswordSchema, type ResetPasswordFormData } from "../schemas/auth-schemas";
import { KeyRound } from "lucide-react";

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => void;
  loading: boolean;
  onBackToLogin: () => void;
  email: string;
}

export default function ResetPasswordForm({
  onSubmit,
  loading,
  onBackToLogin,
  email,
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { verificationCode: "", newPassword: "", confirmNewPassword: "" },
    mode: "onTouched",
  });

  const watchedPassword = watch("newPassword");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 shrink-0" />
          <span className="font-medium">Restablecer contraseña</span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-300">
          Ingresa el código que enviamos a <strong>{email}</strong> y tu nueva contraseña.
        </p>
      </div>

      <FormField
        id="reset-code"
        label="Código de verificación"
        placeholder="123456"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        hint="Revisa tu correo electrónico"
        error={errors.verificationCode?.message}
        required
        {...register("verificationCode")}
      />

      <PasswordInput
        id="reset-newPassword"
        label="Nueva contraseña"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        showStrength
        strengthValue={watchedPassword}
        required
        {...register("newPassword")}
      />

      <PasswordInput
        id="reset-confirmNewPassword"
        label="Confirmar nueva contraseña"
        placeholder="Repite tu nueva contraseña"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        required
        {...register("confirmNewPassword")}
      />

      <SubmitButton loading={loading} loadingText="Actualizando contraseña..." text="Restablecer contraseña" />

      <div className="text-center">
        <Button type="button" variant="link" onClick={onBackToLogin} className="text-sm">
          Volver al inicio de sesión
        </Button>
      </div>
    </form>
  );
}
