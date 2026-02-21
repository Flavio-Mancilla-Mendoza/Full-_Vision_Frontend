// src/components/auth/AuthCard.tsx
import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  registerUser,
  loginUser,
  confirmUserRegistration,
  resendConfirmationCode,
  completeNewPasswordChallenge,
  forgotPassword,
  resetPasswordWithCode,
} from "@/services/cognito-auth";

// Formularios (cada uno maneja su propio estado via react-hook-form)
import LoginForm from "./forms/LoginForm";
import RegisterForm from "./forms/RegisterForm";
import VerifyEmailForm from "./forms/VerifyEmailForm";
import NewPasswordForm from "./forms/NewPasswordForm";
import ForgotPasswordForm from "./forms/ForgotPasswordForm";
import ResetPasswordForm from "./forms/ResetPasswordForm";

import {
  parseFullName,
  type AuthMode,
  type LoginFormData,
  type RegisterFormData,
  type VerifyEmailFormData,
  type NewPasswordFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from "./schemas/auth-schemas";

const MODE_TITLES: Record<AuthMode, string> = {
  login: "Iniciar sesión",
  register: "Crear cuenta",
  newPassword: "Cambiar contraseña",
  confirm: "Verificar correo",
  forgotPassword: "Recuperar contraseña",
  resetPassword: "Restablecer contraseña",
};

export default function AuthCard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Shared state (only what crosses form boundaries) ────────────
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [cognitoUsername, setCognitoUsername] = useState("");

  // Ruta a la que redirigir después del login
  const redirectTo = (location.state as { from?: string })?.from || "/";

  // ── Navigation helpers ─────────────────────────────────────────
  const switchMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
  }, []);

  const handleBackToLogin = useCallback(() => {
    setMode("login");
  }, []);

  const handleForgotPassword = useCallback(() => {
    setMode("forgotPassword");
  }, []);

  // ── Form submit handlers ───────────────────────────────────────

  const handleLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await loginUser(data.email, data.password);
      if (!result.success) {
        if (result.error?.includes("verifica tu email")) {
          toast({ title: "Email no verificado", description: result.error, variant: "destructive" });
          setPendingEmail(data.email);
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
      toast({ title: "Sesión iniciada exitosamente" });
      navigate(redirectTo, { replace: true });
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

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const result = await registerUser(data.email, data.password, data.fullName);
      if (!result.success) throw new Error(result.error);
      if (result.username) setCognitoUsername(result.username);
      setPendingEmail(data.email);
      toast({
        title: "Registro exitoso",
        description: "Revisa tu correo y ingresa el código de verificación",
      });
      setMode("confirm");
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

  const handleVerifySubmit = async (data: VerifyEmailFormData) => {
    setLoading(true);
    try {
      const usernameForConfirm = cognitoUsername || data.email;
      const result = await confirmUserRegistration(usernameForConfirm, data.verificationCode);
      if (!result.success) throw new Error(result.error);
      toast({
        title: "Cuenta verificada",
        description: "Ya puedes iniciar sesión con tu cuenta",
      });
      setMode("login");
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

  const handleForgotSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const result = await forgotPassword(data.email);
      if (!result.success) throw new Error(result.error);
      setPendingEmail(data.email);
      toast({
        title: "Código enviado",
        description: "Revisa tu correo electrónico para el código de recuperación",
      });
      setMode("resetPassword");
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

  const handleResetSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      const result = await resetPasswordWithCode(
        pendingEmail,
        data.verificationCode,
        data.newPassword
      );
      if (!result.success) throw new Error(result.error);
      toast({
        title: "Contraseña actualizada",
        description: "Ya puedes iniciar sesión con tu nueva contraseña",
      });
      setMode("login");
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

  const handleNewPasswordSubmit = async (data: NewPasswordFormData) => {
    setLoading(true);
    try {
      const userAttributes = parseFullName(data.fullName);
      const result = await completeNewPasswordChallenge(data.newPassword, userAttributes);
      if (!result.success) throw new Error(result.error);
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se actualizó correctamente e iniciaste sesión",
      });
      if (result.user) navigate(redirectTo, { replace: true });
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
      const usernameForResend = cognitoUsername || pendingEmail;
      const result = await resendConfirmationCode(usernameForResend);
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

  // ── Render ─────────────────────────────────────────────────────

  const renderForm = () => {
    switch (mode) {
      case "newPassword":
        return <NewPasswordForm onSubmit={handleNewPasswordSubmit} loading={loading} />;
      case "confirm":
        return (
          <VerifyEmailForm
            onSubmit={handleVerifySubmit}
            loading={loading}
            onResendCode={handleResendCode}
            onBackToLogin={handleBackToLogin}
            defaultEmail={pendingEmail}
          />
        );
      case "register":
        return <RegisterForm onSubmit={handleRegisterSubmit} loading={loading} onSwitchMode={switchMode} />;
      case "forgotPassword":
        return (
          <ForgotPasswordForm
            onSubmit={handleForgotSubmit}
            loading={loading}
            onBackToLogin={handleBackToLogin}
          />
        );
      case "resetPassword":
        return (
          <ResetPasswordForm
            onSubmit={handleResetSubmit}
            loading={loading}
            onBackToLogin={handleBackToLogin}
            email={pendingEmail}
          />
        );
      case "login":
      default:
        return (
          <LoginForm
            onSubmit={handleLoginSubmit}
            loading={loading}
            onSwitchMode={switchMode}
            onForgotPassword={handleForgotPassword}
          />
        );
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
        {mode !== "confirm" && mode !== "newPassword" && mode !== "forgotPassword" && mode !== "resetPassword" && (
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
