// src/components/auth/forms/ForgotPasswordForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../schemas/auth-schemas";
import { Mail } from "lucide-react";

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => void;
  loading: boolean;
  onBackToLogin: () => void;
  defaultEmail?: string;
}

export default function ForgotPasswordForm({
  onSubmit,
  loading,
  onBackToLogin,
  defaultEmail = "",
}: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="font-medium">Recuperar contraseña</span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-300">
          Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
        </p>
      </div>

      <FormField
        id="forgot-email"
        label="Correo electrónico"
        type="email"
        placeholder="tu@ejemplo.com"
        autoComplete="email"
        error={errors.email?.message}
        required
        {...register("email")}
      />

      <SubmitButton loading={loading} loadingText="Enviando código..." text="Enviar código de recuperación" />

      <div className="text-center">
        <Button type="button" variant="link" onClick={onBackToLogin} className="text-sm">
          Volver al inicio de sesión
        </Button>
      </div>
    </form>
  );
}
