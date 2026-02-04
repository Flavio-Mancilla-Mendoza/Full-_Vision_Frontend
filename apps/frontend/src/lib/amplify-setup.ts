/**
 * Configuración AWS Amplify v6
 * Configuración SÍNCRONA garantizada antes de cualquier import
 */

console.log("🔥 [amplify-setup] ========== ARCHIVO CARGADO ==========");

import { Amplify, ResourcesConfig } from "aws-amplify";

// Variables de entorno - leídas síncronamente al cargar el módulo
const userPoolId = import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
const region = import.meta.env.VITE_AWS_REGION;

console.log("🚀 [amplify-setup] Configurando Amplify v6 - MÓDULO CARGADO");
console.log("📍 Region:", region);
console.log("🏊 UserPool:", userPoolId);
console.log("🔑 ClientID:", userPoolClientId);

// Validar variables ANTES de continuar
if (!userPoolId || !userPoolClientId || !region) {
  const error = "❌ Variables de entorno de Cognito no están definidas";
  console.error(error);
  console.error("Verifica que .env tenga:");
  console.error("- VITE_AWS_REGION");
  console.error("- VITE_AWS_COGNITO_USER_POOL_ID");
  console.error("- VITE_AWS_COGNITO_CLIENT_ID");
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

console.log("📝 [amplify-setup] Configuración a aplicar:");
console.log(JSON.stringify(amplifyConfig, null, 2));

// Configurar SÍNCRONAMENTE al cargar el módulo
console.log("📝 [amplify-setup] Aplicando configuración Cognito...");

try {
  Amplify.configure(amplifyConfig);
  console.log("✅ [amplify-setup] Amplify.configure() ejecutado");

  // Verificar que la configuración se guardó
  const currentConfig = Amplify.getConfig();
  console.log("✅ Config actual en Amplify:");
  console.log(JSON.stringify(currentConfig, null, 2));
} catch (error) {
  console.error("❌ ERROR al configurar Amplify:", error);
  throw error;
}

/**
 * Función auxiliar para verificar estado
 * Amplify se configuró síncronamente al cargar este módulo
 */
export function ensureAmplifyConfigured() {
  console.log("✅ [ensureAmplifyConfigured] Amplify ya fue configurado al cargar el módulo");
  return true;
}

// Log final
console.log("🎯 [amplify-setup] ✅ INICIALIZACIÓN COMPLETA - Amplify listo");
