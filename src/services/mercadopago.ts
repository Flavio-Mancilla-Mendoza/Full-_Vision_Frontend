// src/services/mercadopago.ts - Servicio para integración con Mercado Pago
import { fetchAuthSession } from "@aws-amplify/auth";

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "https://your-api-id.execute-api.sa-east-1.amazonaws.com/dev";

/**
 * Obtener JWT token de Cognito
 */
async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      throw new Error("No authentication token available");
    }
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw new Error("Authentication required");
  }
}

export interface MercadoPagoItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MercadoPagoPreference {
  id: string;
  init_point: string; // URL para redirigir al cliente
  sandbox_init_point?: string; // URL para testing
}

export interface CreatePreferenceRequest {
  orderId: string;
  payer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * Crea una preferencia de pago en Mercado Pago
 * Solo envía orderId — el Lambda consulta items y precios de la BD
 */
export async function createMercadoPagoPreference(request: CreatePreferenceRequest): Promise<MercadoPagoPreference> {
  try {
    const baseUrl = window.location.origin;

    // Llamar a Lambda vía API Gateway que crea la preferencia
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/mercadopago/create-preference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: request.orderId,
        payer: request.payer,
        // URLs de retorno
        back_urls: {
          success: `${baseUrl}/order-confirmation/${request.orderId}?payment=success`,
          failure: `${baseUrl}/checkout?payment=failure&order=${request.orderId}`,
          pending: `${baseUrl}/order-confirmation/${request.orderId}?payment=pending`,
        },
        auto_return: "approved", // Redirige automáticamente si se aprueba
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creando preferencia: ${response.status}`);
    }

    const data: MercadoPagoPreference = await response.json();

    if (!data || !data.init_point) {
      throw new Error("No se recibió URL de pago de Mercado Pago");
    }

    return data;
  } catch (error) {
    console.error("Error en createMercadoPagoPreference:", error);
    throw error;
  }
}

/**
 * Nota: La verificación del estado de pago se hace automáticamente
 * vía webhook de Mercado Pago que actualiza la orden en la base de datos.
 * No es necesaria una función de verificación manual desde el frontend.
 */
