// src/components/auth/forms/RegisterForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import PasswordInput from "../components/PasswordInput";
import SubmitButton from "../components/SubmitButton";
import { registerSchema, type RegisterFormData } from "../schemas/auth-schemas";

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  loading: boolean;
  onSwitchMode: () => void;
}

export default function RegisterForm({
  onSubmit,
  loading,
  onSwitchMode,
}: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const watchedPassword = watch("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="reg-fullName"
        label="Nombre completo"
        placeholder="Tu nombre completo"
        autoComplete="name"
        error={errors.fullName?.message}
        required
        {...register("fullName")}
      />

      <FormField
        id="reg-email"
        label="Correo electrónico"
        type="email"
        placeholder="tu@ejemplo.com"
        autoComplete="email"
        error={errors.email?.message}
        required
        {...register("email")}
      />

      <PasswordInput
        id="reg-password"
        label="Contraseña"
        autoComplete="new-password"
        error={errors.password?.message}
        showStrength
        strengthValue={watchedPassword}
        required
        {...register("password")}
      />

      <PasswordInput
        id="reg-confirmPassword"
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        required
        {...register("confirmPassword")}
      />

      <SubmitButton loading={loading} loadingText="Procesando..." text="Crear cuenta" />

      <div className="text-center">
        <Button type="button" variant="link" onClick={onSwitchMode} className="text-sm">
          ¿Ya tienes cuenta? Inicia sesión
        </Button>
      </div>
    </form>
  );
}
