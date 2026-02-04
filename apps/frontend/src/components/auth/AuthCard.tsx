// src/components/auth/AuthCard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  registerUser,
  loginUser,
  confirmUserRegistration,
  resendConfirmationCode,
  completeNewPasswordChallenge,
} from "@/services/cognito-auth";

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  confirmPassword?: string;
  verificationCode?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  newPasswordFullName?: string;
}

interface AuthFormData {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
  verificationCode: string;
  newPassword: string;
  confirmNewPassword: string;
  newPasswordFullName: string;
}

export default function AuthCard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "confirm" | "newPassword">("login");
  const initialForm: AuthFormData = {
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
    verificationCode: "",
    newPassword: "",
    confirmNewPassword: "",
    newPasswordFullName: "",
  };

  const [formData, setFormData] = useState<AuthFormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Ingresa un correo válido";
    }

    // Password validation for Cognito (más estricta)
    if (mode !== "confirm") {
      const passwordToValidate = mode === "newPassword" ? formData.newPassword : formData.password;

      if (passwordToValidate.length < 8) {
        if (mode === "newPassword") {
          newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres";
        } else {
          newErrors.password = "La contraseña debe tener al menos 8 caracteres";
        }
      } else if (!/[a-z]/.test(passwordToValidate)) {
        if (mode === "newPassword") {
          newErrors.newPassword = "Debe incluir al menos una letra minúscula";
        } else {
          newErrors.password = "Debe incluir al menos una letra minúscula";
        }
      } else if (!/[A-Z]/.test(passwordToValidate)) {
        if (mode === "newPassword") {
          newErrors.newPassword = "Debe incluir al menos una letra mayúscula";
        } else {
          newErrors.password = "Debe incluir al menos una letra mayúscula";
        }
      } else if (!/[0-9]/.test(passwordToValidate)) {
        if (mode === "newPassword") {
          newErrors.newPassword = "Debe incluir al menos un número";
        } else {
          newErrors.password = "Debe incluir al menos un número";
        }
      } else if (!/[^a-zA-Z0-9]/.test(passwordToValidate)) {
        if (mode === "newPassword") {
          newErrors.newPassword = "Debe incluir al menos un carácter especial";
        } else {
          newErrors.password = "Debe incluir al menos un carácter especial";
        }
      }
    }

    // Full name validation (only for register)
    if (mode === "register") {
      if (formData.fullName.trim().length < 2) {
        newErrors.fullName = "El nombre debe tener al menos 2 caracteres";
      }

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    // New password confirmation validation
    if (mode === "newPassword") {
      if (formData.newPasswordFullName.trim().length < 2) {
        newErrors.newPasswordFullName = "El nombre completo es requerido";
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = "Las contraseñas no coinciden";
      }
    }

    // Verification code validation
    if (mode === "confirm" && formData.verificationCode.length !== 6) {
      newErrors.verificationCode = "El código debe tener 6 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === "newPassword") {
        // Cambiar contraseña temporal
        const nameParts = formData.newPasswordFullName.trim().split(" ");
        const given_name = nameParts[0];
        const family_name = nameParts.slice(1).join(" ") || given_name;

        const result = await completeNewPasswordChallenge(formData.newPassword, {
          given_name,
          family_name,
          name: formData.newPasswordFullName.trim(),
        });

        if (!result.success) throw new Error(result.error);

        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña se actualizó correctamente e iniciaste sesión",
        });

        if (result.user) {
          // Redirigir al dashboard
          navigate("/admin/dashboard", { replace: true });
        }
      } else if (mode === "confirm") {
        // Confirmar registro con código
        const result = await confirmUserRegistration(formData.email, formData.verificationCode);

        if (!result.success) throw new Error(result.error);

        toast({
          title: "Cuenta verificada",
          description: "Ya puedes iniciar sesión con tu cuenta",
        });

        // Cambiar a modo login
        setMode("login");
        setFormData((prev) => ({ ...prev, verificationCode: "", password: "" }));
      } else if (mode === "register") {
        // Registro con Cognito
        const result = await registerUser(formData.email, formData.password, formData.fullName.trim());

        if (!result.success) throw new Error(result.error);

        toast({
          title: "Registro exitoso",
          description: "Revisa tu correo y ingresa el código de verificación",
        });

        // Cambiar a modo de confirmación
        setMode("confirm");
      } else {
        // Login con Cognito
        const result = await loginUser(formData.email, formData.password);

        if (!result.success) {
          // Verificar si necesita confirmar email
          if (result.error?.includes("verifica tu email")) {
            toast({
              title: "Email no verificado",
              description: result.error,
              variant: "destructive",
            });
            setMode("confirm");
            return;
          }

          // Verificar si necesita cambiar contraseña
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

        if (result.user) {
          toast({ title: "Sesión iniciada exitosamente" });

          // Verificar si es admin usando la función que chequea grupos de Cognito
          const { useAuth } = await import("@/hooks/useAuthCognito");

          // Redirigir a dashboard admin si está en el grupo Admins
          // La verificación real se hace en el hook useAuth con getUserRole
          navigate("/admin/dashboard", { replace: true });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      toast({
        title: "Error de autenticación",
        description: errorMessage,
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

      toast({
        title: "Código reenviado",
        description: "Revisa tu correo nuevamente",
      });
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

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setErrors({});
    setFormData(initialForm);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {mode === "login"
            ? "Iniciar sesión"
            : mode === "register"
              ? "Crear cuenta"
              : mode === "newPassword"
                ? "Cambiar contraseña"
                : "Verificar correo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {mode === "newPassword" ? (
            // Formulario de cambio de contraseña obligatorio
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Contraseña temporal detectada.</strong> Por seguridad, debes establecer una nueva contraseña permanente antes de
                  continuar.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPasswordFullName">Nombre completo</Label>
                <Input
                  id="newPasswordFullName"
                  type="text"
                  value={formData.newPasswordFullName}
                  onChange={(e) => handleInputChange("newPasswordFullName", e.target.value)}
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                  aria-invalid={!!errors.newPasswordFullName}
                  aria-describedby={errors.newPasswordFullName ? "newPasswordFullName-error" : undefined}
                />
                {errors.newPasswordFullName && (
                  <p id="newPasswordFullName-error" className="text-sm text-red-600">
                    {errors.newPasswordFullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    aria-invalid={!!errors.newPassword}
                    aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p id="newPassword-error" className="text-sm text-red-600">
                    {errors.newPassword}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Debe incluir mayúsculas, minúsculas, números y caracteres especiales</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={(e) => handleInputChange("confirmNewPassword", e.target.value)}
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

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Actualizando..." : "Establecer contraseña e iniciar sesión"}
              </Button>
            </>
          ) : mode === "confirm" ? (
            // Formulario de verificación
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="tu@ejemplo.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Código de verificación</Label>
                <Input
                  id="verificationCode"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange("verificationCode", e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  aria-invalid={!!errors.verificationCode}
                  aria-describedby={errors.verificationCode ? "verificationCode-error" : undefined}
                />
                {errors.verificationCode && (
                  <p id="verificationCode-error" className="text-sm text-red-600">
                    {errors.verificationCode}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Ingresa el código de 6 dígitos que enviamos a tu correo</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Verificando..." : "Verificar cuenta"}
              </Button>

              <Button type="button" variant="outline" onClick={handleResendCode} disabled={loading} className="w-full">
                Reenviar código
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                  }}
                  className="text-sm"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            </>
          ) : (
            // Formulario de login/registro
            <>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Tu nombre completo"
                    autoComplete="name"
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  />
                  {errors.fullName && (
                    <p id="fullName-error" className="text-sm text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="tu@ejemplo.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Button>

              <div className="text-center">
                <Button type="button" variant="link" onClick={switchMode} className="text-sm">
                  {mode === "login" ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
                </Button>
              </div>
            </>
          )}
        </form>

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
