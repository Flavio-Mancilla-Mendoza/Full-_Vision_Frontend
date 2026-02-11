// src/components/checkout/types.ts - Tipos y constantes del checkout

export type CheckoutStep = "shipping" | "payment" | "confirm";

export type DeliveryMethod = "shipping" | "pickup";

export type PaymentMethodType = "mercadopago" | "yape" | "transfer" | "cod" | "store";

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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  mercadopago: "Mercado Pago",
  yape: "Yape / Plin",
  transfer: "Transferencia Bancaria",
  cod: "Pago Contra Entrega",
  store: "Pago en Tienda",
};

export const STORE_ADDRESS = "Av. Petit Thouars 1821, Lince 15046 Lima, Perú";
export const STORE_HOURS = "Lun - Sáb: 9:00 AM - 6:00 PM";

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
