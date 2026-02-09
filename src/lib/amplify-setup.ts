/**
 * Configuración AWS Amplify v6
 * Configuración SÍNCRONA garantizada antes de cualquier import
 */

import { Amplify, ResourcesConfig } from "aws-amplify";

// Variables de entorno - leídas síncronamente al cargar el módulo
const userPoolId = import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION;

// Validar variables ANTES de continuar
if (!userPoolId || !userPoolClientId || !region) {
  const error = "❌ Variables de entorno de Cognito no están definidas. Verifica VITE_AWS_REGION, VITE_AWS_COGNITO_USER_POOL_ID y VITE_AWS_COGNITO_CLIENT_ID en .env";
  console.error(error);
  throw new Error(error);
}

// Configuración usando ResourcesConfig - MÍNIMO REQUERIDO
const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: userPoolId,
      userPoolClientId: userPoolClientId,
    },
  },
};

// Configurar SÍNCRONAMENTE al cargar el módulo
try {
  Amplify.configure(amplifyConfig);
} catch (error) {
  console.error("❌ ERROR al configurar Amplify:", error);
  throw error;
}

/**
 * Función auxiliar para verificar estado
 * Amplify se configuró síncronamente al cargar este módulo
 */
export function ensureAmplifyConfigured() {
  return true;
}
