/**
 * AWS Cognito Authentication Service
 * Reemplaza Supabase Auth con AWS Cognito
 */

// PRIMERO: Asegurar que Amplify esté configurado
import "../lib/amplify-setup";

// DESPUÉS: Importar funciones de auth
import { ensureAmplifyConfigured } from "../lib/amplify-setup";
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  updatePassword,
  updateUserAttributes,
  fetchUserAttributes,
  confirmSignIn,
  type SignInInput,
  type SignUpInput,
} from "@aws-amplify/auth";

export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  attributes?: Partial<Record<string, string>>;
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
}

/**
 * Registrar nuevo usuario
 */
export async function registerUser(email: string, password: string, name?: string) {
  try {
    const signUpInput: SignUpInput = {
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          ...(name && { name }),
        },
      },
    };

    const { userId, isSignUpComplete, nextStep } = await signUp(signUpInput);

    return {
      success: true,
      userId,
      isComplete: isSignUpComplete,
      nextStep: nextStep.signUpStep,
      message: "Usuario registrado. Verifica tu email para confirmar la cuenta.",
    };
  } catch (error: unknown) {
    console.error("Error registrando usuario:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al registrar usuario";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Confirmar registro de usuario con código de verificación
 */
export async function confirmUserRegistration(email: string, code: string) {
  try {
    const { isSignUpComplete } = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });

    return {
      success: true,
      isComplete: isSignUpComplete,
      message: "Cuenta verificada exitosamente",
    };
  } catch (error: unknown) {
    console.error("Error confirmando usuario:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al confirmar cuenta";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Reenviar código de confirmación
 */
export async function resendConfirmationCode(email: string) {
  try {
    await resendSignUpCode({ username: email });
    return {
      success: true,
      message: "Código de confirmación reenviado",
    };
  } catch (error: unknown) {
    console.error("Error reenviando código:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al reenviar código";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Iniciar sesión
 */
export async function loginUser(email: string, password: string) {
  try {
    // Asegurar que Amplify esté configurado antes del login
    console.log("🔐 Intentando login para:", email);
    ensureAmplifyConfigured();

    const signInInput: SignInInput = {
      username: email,
      password,
    };

    const { isSignedIn, nextStep } = await signIn(signInInput);

    // Manejar diferentes estados de autenticación
    if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      return {
        success: false,
        requiresNewPassword: true,
        nextStep: nextStep.signInStep,
        email, // Pasar el email para usar en el cambio de contraseña
        error: "Debes cambiar tu contraseña temporal",
      };
    }

    if (!isSignedIn) {
      return {
        success: false,
        nextStep: nextStep.signInStep,
        error: "Autenticación incompleta. Siguiente paso: " + nextStep.signInStep,
      };
    }

    // Obtener información del usuario
    const user = await getCurrentAuthUser();

    return {
      success: true,
      user,
      message: "Inicio de sesión exitoso",
    };
  } catch (error: unknown) {
    console.error("Error iniciando sesión:", error);

    let errorMessage = "Error al iniciar sesión";

    if (error && typeof error === "object" && "name" in error) {
      if (error.name === "UserNotConfirmedException") {
        errorMessage = "Por favor verifica tu email antes de iniciar sesión";
      } else if (error.name === "NotAuthorizedException") {
        errorMessage = "Email o contraseña incorrectos";
      } else if (error.name === "UserNotFoundException") {
        errorMessage = "Usuario no encontrado";
      }
    }

    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Completar cambio de contraseña requerido por Cognito (NEW_PASSWORD_REQUIRED)
 */
export async function completeNewPasswordChallenge(
  newPassword: string,
  userAttributes?: { given_name?: string; family_name?: string; name?: string }
) {
  try {
    console.log("🔑 Completando cambio de contraseña requerido");

    // Preparar atributos de usuario si se proporcionan
    interface ConfirmSignInOptions {
      challengeResponse: string;
      options?: {
        userAttributes?: {
          given_name?: string;
          family_name?: string;
          name?: string;
        };
      };
    }

    const options: ConfirmSignInOptions = {
      challengeResponse: newPassword,
    };

    if (userAttributes) {
      options.options = {
        userAttributes,
      };
    }

    const { isSignedIn, nextStep } = await confirmSignIn(options);

    if (!isSignedIn) {
      return {
        success: false,
        nextStep: nextStep.signInStep,
        error: "Autenticación incompleta después del cambio de contraseña",
      };
    }

    // Obtener información del usuario
    const user = await getCurrentAuthUser();

    return {
      success: true,
      user,
      message: "Contraseña actualizada e inicio de sesión exitoso",
    };
  } catch (error: unknown) {
    console.error("Error completando cambio de contraseña:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al cambiar contraseña";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cerrar sesión
 */
export async function logoutUser() {
  try {
    await signOut();
    return {
      success: true,
      message: "Sesión cerrada exitosamente",
    };
  } catch (error: unknown) {
    console.error("Error cerrando sesión:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al cerrar sesión";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Obtener usuario actual autenticado
 */
export async function getCurrentAuthUser(): Promise<User | null> {
  try {
    // Primero verificar que la sesión tenga tokens válidos
    const session = await fetchAuthSession();
    if (!session.tokens?.accessToken) {
      return null;
    }

    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    return {
      id: user.userId,
      email: attributes.email || "",
      name: attributes.name,
      emailVerified: attributes.email_verified === "true",
      attributes,
    };
  } catch (error) {
    // Sesión expirada/inválida - limpiar silenciosamente
    try {
      await signOut();
    } catch { /* ignorar error de signOut */ }
    return null;
  }
}

/**
 * Obtener sesión actual
 */
export async function getCurrentAuthSession(): Promise<AuthSession> {
  try {
    const session = await fetchAuthSession();

    // Si no hay tokens válidos, no intentar obtener usuario
    if (!session.tokens?.accessToken) {
      return { user: null, accessToken: null, idToken: null };
    }

    const user = await getCurrentAuthUser();

    return {
      user,
      accessToken: session.tokens?.accessToken?.toString() || null,
      idToken: session.tokens?.idToken?.toString() || null,
    };
  } catch (error) {
    console.error("Error obteniendo sesión:", error);
    return {
      user: null,
      accessToken: null,
      idToken: null,
    };
  }
}

/**
 * Verificar si el usuario está autenticado
 * Valida que existan tokens válidos, no solo datos en cache
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    // Verificar que hay tokens válidos, no solo datos en cache
    return !!session.tokens?.accessToken;
  } catch {
    return false;
  }
}

/**
 * Iniciar recuperación de contraseña
 */
export async function forgotPassword(email: string) {
  try {
    const { nextStep } = await resetPassword({ username: email });

    return {
      success: true,
      nextStep: nextStep.resetPasswordStep,
      message: "Código de recuperación enviado a tu email",
    };
  } catch (error: unknown) {
    console.error("Error en recuperación de contraseña:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al solicitar recuperación de contraseña";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Confirmar nueva contraseña con código
 */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });

    return {
      success: true,
      message: "Contraseña actualizada exitosamente",
    };
  } catch (error: unknown) {
    console.error("Error confirmando nueva contraseña:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al actualizar contraseña";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cambiar contraseña del usuario autenticado
 */
export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    await updatePassword({ oldPassword, newPassword });

    return {
      success: true,
      message: "Contraseña actualizada exitosamente",
    };
  } catch (error: unknown) {
    console.error("Error cambiando contraseña:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al cambiar contraseña";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Actualizar atributos del usuario
 */
export async function updateUserProfile(attributes: Record<string, string>) {
  try {
    await updateUserAttributes({ userAttributes: attributes });

    return {
      success: true,
      message: "Perfil actualizado exitosamente",
    };
  } catch (error: unknown) {
    console.error("Error actualizando perfil:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al actualizar perfil";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Obtener el access token actual para llamadas API
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch (error) {
    console.error("Error obteniendo access token:", error);
    return null;
  }
}

/**
 * Obtener el ID del usuario actual
 * Función auxiliar para compatibilidad con código que usa Supabase
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await getCurrentAuthUser();
    return user?.id || null;
  } catch (error) {
    console.error("Error obteniendo user ID:", error);
    return null;
  }
}

// Exportar como default para compatibilidad
export default {
  registerUser,
  confirmUserRegistration,
  resendConfirmationCode,
  loginUser,
  completeNewPasswordChallenge,
  logoutUser,
  getCurrentAuthUser,
  getCurrentAuthSession,
  isAuthenticated,
  forgotPassword,
  resetPasswordWithCode,
  changePassword,
  updateUserProfile,
  getCurrentUserId,
  getAccessToken,
};
