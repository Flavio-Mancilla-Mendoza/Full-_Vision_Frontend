// src/components/auth/forms/VerifyEmailForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { verifyEmailSchema, type VerifyEmailFormData } from "../schemas/auth-schemas";

interface VerifyEmailFormProps {
  onSubmit: (data: VerifyEmailFormData) => void;
  loading: boolean;
  onResendCode: () => void;
  onBackToLogin: () => void;
  defaultEmail?: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailForm({
  onSubmit,
  loading,
  onResendCode,
  onBackToLogin,
  defaultEmail = "",
}: VerifyEmailFormProps) {
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: defaultEmail, verificationCode: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(() => {
    onResendCode();
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }, [onResendCode]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        id="verify-email"
        label="Correo electrónico"
        type="email"
        placeholder="tu@ejemplo.com"
        autoComplete="email"
        error={errors.email?.message}
        readOnly
        className="bg-muted cursor-not-allowed"
        required
        {...register("email")}
      />

      <FormField
        id="verify-code"
        label="Código de verificación"
        placeholder="123456"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        hint="Ingresa el código de 6 dígitos que enviamos a tu correo"
        error={errors.verificationCode?.message}
        required
        {...register("verificationCode")}
      />

      <SubmitButton loading={loading} loadingText="Verificando..." text="Verificar cuenta" />

      <Button
        type="button"
        variant="outline"
        onClick={handleResend}
        disabled={loading || cooldown > 0}
        className="w-full"
      >
        {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
      </Button>

      <div className="text-center">
        <Button type="button" variant="link" onClick={onBackToLogin} className="text-sm">
          Volver al inicio de sesión
        </Button>
      </div>
    </form>
  );
}
