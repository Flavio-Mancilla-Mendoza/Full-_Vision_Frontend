// src/components/auth/forms/NewPasswordForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import { newPasswordSchema, type NewPasswordFormData } from "../schemas/auth-schemas";

interface NewPasswordFormProps {
  onSubmit: (data: NewPasswordFormData) => void;
  loading: boolean;
}

export default function NewPasswordForm({
  onSubmit,
  loading,
}: NewPasswordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { fullName: "", newPassword: "", confirmNewPassword: "" },
    mode: "onTouched",
  });

  const watchedPassword = watch("newPassword");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 dark:border-blue-800 dark:bg-blue-950/50">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Contraseña temporal detectada.</strong> Por seguridad, debes
          establecer una nueva contraseña permanente antes de continuar.
        </p>
      </div>

      <FormField
        id="np-fullName"
        label="Nombre completo"
        placeholder="Tu nombre completo"
        autoComplete="name"
        error={errors.fullName?.message}
        required
        {...register("fullName")}
      />

      <PasswordInput
        id="np-newPassword"
        label="Nueva contraseña"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        showStrength
        strengthValue={watchedPassword}
        required
        {...register("newPassword")}
      />

      <PasswordInput
        id="np-confirmNewPassword"
        label="Confirmar nueva contraseña"
        placeholder="Repite tu nueva contraseña"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        required
        {...register("confirmNewPassword")}
      />

      <SubmitButton
        loading={loading}
        loadingText="Actualizando..."
        text="Establecer contraseña e iniciar sesión"
      />
    </form>
  );
}
