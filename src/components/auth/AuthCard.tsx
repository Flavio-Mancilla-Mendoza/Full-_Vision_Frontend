// src/components/auth/AuthCard.tsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  registerUser,
  loginUser,
  confirmUserRegistration,
  resendConfirmationCode,
  completeNewPasswordChallenge,
} from "@/services/cognito-auth";

// Componentes modularizados
import LoginForm from "./forms/LoginForm";
import RegisterForm from "./forms/RegisterForm";
import VerifyEmailForm from "./forms/VerifyEmailForm";
import NewPasswordForm from "./forms/NewPasswordForm";
import {
  useAuthValidation,
  initialFormData,
  parseFullName,
  type AuthFormData,
  type AuthMode,
} from "./hooks/useAuthValidation";

const MODE_TITLES: Record<AuthMode, string> = {
  login: "Iniciar sesión",
  register: "Crear cuenta",
  newPassword: "Cambiar contraseña",
  confirm: "Verificar correo",
};

export default function AuthCard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [formData, setFormData] = useState<AuthFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { errors, clearError, clearAllErrors, validate } = useAuthValidation();

  const handleInputChange = useCallback(
    (field: keyof AuthFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      clearError(field);
    },
    [clearError]
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    clearAllErrors();
  }, [clearAllErrors]);

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    resetForm();
  }, [resetForm]);

  const handleBackToLogin = useCallback(() => {
    setMode("login");
    clearAllErrors();
  }, [clearAllErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(mode, formData)) return;

    setLoading(true);
    try {
      switch (mode) {
        case "newPassword": {
          const userAttributes = parseFullName(formData.newPasswordFullName);
          const result = await completeNewPasswordChallenge(formData.newPassword, userAttributes);
          if (!result.success) throw new Error(result.error);
          toast({
            title: "Contraseña actualizada",
            description: "Tu contraseña se actualizó correctamente e iniciaste sesión",
          });
          if (result.user) navigate("/admin/dashboard", { replace: true });
          break;
        }

        case "confirm": {
          const result = await confirmUserRegistration(formData.email, formData.verificationCode);
          if (!result.success) throw new Error(result.error);
          toast({
            title: "Cuenta verificada",
            description: "Ya puedes iniciar sesión con tu cuenta",
          });
          setMode("login");
          setFormData((prev) => ({ ...prev, verificationCode: "", password: "" }));
          break;
        }

        case "register": {
          const result = await registerUser(formData.email, formData.password, formData.fullName.trim());
          if (!result.success) throw new Error(result.error);
          toast({
            title: "Registro exitoso",
            description: "Revisa tu correo y ingresa el código de verificación",
          });
          setMode("confirm");
          break;
        }

        case "login": {
          const result = await loginUser(formData.email, formData.password);
          if (!result.success) {
            if (result.error?.includes("verifica tu email")) {
              toast({ title: "Email no verificado", description: result.error, variant: "destructive" });
              setMode("confirm");
              return;
            }
            if (result.requiresNewPassword) {
              toast({
                title: "Cambio de contraseña requerido",
                description: "Debes establecer una nueva contraseña permanente",
              });
              setMode("newPassword");
              return;
            }
            throw new Error(result.error);
          }
          // Login exitoso: result.success === true ya garantiza isSignedIn
          toast({ title: "Sesión iniciada exitosamente" });
          navigate("/", { replace: true });
          break;
        }
      }
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const result = await resendConfirmationCode(formData.email);
      if (!result.success) throw new Error(result.error);
      toast({ title: "Código reenviado", description: "Revisa tu correo nuevamente" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo reenviar el código",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    const commonProps = { formData, errors, loading, onInputChange: handleInputChange, onSubmit: handleSubmit };

    switch (mode) {
      case "newPassword":
        return <NewPasswordForm {...commonProps} />;
      case "confirm":
        return (
          <VerifyEmailForm
            {...commonProps}
            onResendCode={handleResendCode}
            onBackToLogin={handleBackToLogin}
          />
        );
      case "register":
        return <RegisterForm {...commonProps} onSwitchMode={switchMode} />;
      case "login":
      default:
        return <LoginForm {...commonProps} onSwitchMode={switchMode} />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{MODE_TITLES[mode]}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderForm()}

        {/* Opciones adicionales de navegación */}
        {mode !== "confirm" && mode !== "newPassword" && (
          <div className="mt-6 space-y-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/")} className="w-full">
              Regresar al inicio
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/", { replace: true })}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Continuar como invitado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
