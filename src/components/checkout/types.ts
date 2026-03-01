// src/components/checkout/types.ts - Tipos y constantes del checkout

export type CheckoutStep = "shipping" | "confirm";

export type DeliveryMethod = "shipping" | "pickup";

export type PaymentMethodType = "mercadopago";

export interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string;
  city: string;
  postal_code: string;
}

export const INITIAL_SHIPPING_INFO: ShippingInfo = {
  name: "",
  email: "",
  phone: "",
  dni: "",
  address: "",
  city: "",
  postal_code: "",
};

export const STORE_ADDRESS = "Av. Lima 1912 Prd. 10 1/2 Jose Galvez - V.M.T.";
export const STORE_HOURS = "Lun - Sáb: 10:00 AM - 7:00 PM";

/**
 * Valida la información de envío/contacto del checkout
 */
export function validateShippingInfo(
  info: ShippingInfo,
  deliveryMethod: DeliveryMethod,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!info.name.trim()) errors.name = "El nombre es requerido";
  if (!info.email.trim()) {
    errors.email = "El email es requerido";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    errors.email = "Email inválido";
  }
  if (!info.phone.trim()) errors.phone = "El teléfono es requerido";

  if (deliveryMethod === "pickup") {
    if (!info.dni.trim()) {
      errors.dni = "El DNI es requerido para retiro en tienda";
    } else if (!/^\d{8}$/.test(info.dni)) {
      errors.dni = "El DNI debe tener 8 dígitos";
    }
  }

  if (deliveryMethod === "shipping") {
    if (!info.address.trim()) errors.address = "La dirección es requerida";
    if (!info.city.trim()) errors.city = "La ciudad es requerida";
    if (!info.postal_code.trim()) errors.postal_code = "El código postal es requerido";
  }

  return errors;
}
