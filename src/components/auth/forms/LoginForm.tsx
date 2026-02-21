// src/components/auth/forms/LoginForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import { loginSchema, type LoginFormData } from "../schemas/auth-schemas";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  loading: boolean;
  onSwitchMode: () => void;
  onForgotPassword: () => void;
  defaultEmail?: string;
}

export default function LoginForm({
  onSubmit,
  loading,
  onSwitchMode,
  onForgotPassword,
  defaultEmail = "",
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: "" },
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="login-email"
        label="Correo electrónico"
        type="email"
        placeholder="tu@ejemplo.com"
        autoComplete="email"
        error={errors.email?.message}
        required
        {...register("email")}
      />

      <PasswordInput
        id="login-password"
        label="Contraseña"
        autoComplete="current-password"
        error={errors.password?.message}
        required
        {...register("password")}
      />

      <SubmitButton loading={loading} loadingText="Procesando..." text="Iniciar sesión" />

      <div className="flex flex-col items-center gap-1">
        <Button type="button" variant="link" onClick={onForgotPassword} className="text-sm text-muted-foreground">
          ¿Olvidaste tu contraseña?
        </Button>
        <Button type="button" variant="link" onClick={onSwitchMode} className="text-sm">
          ¿No tienes cuenta? Regístrate aquí
        </Button>
      </div>
    </form>
  );
}
