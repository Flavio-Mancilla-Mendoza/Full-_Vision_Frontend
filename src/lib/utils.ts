import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number or price string into Peruvian Nuevo Sol currency (PEN).
 * Accepts numbers or strings like "$129.99" or "129.99" and returns
 * a localized string like "S/ 129.99".
 */
export function formatCurrency(value: number | string) {
  if (value === null || value === undefined) return "";

  let amount: number;

  if (typeof value === "number") {
    amount = value;
  } else if (typeof value === "string") {
    // Remove any non-numeric characters except dot and comma
    const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    amount = parseFloat(cleaned);
  } else {
    return String(value);
  }

  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Normaliza valores numéricos para evitar renderizar 0 accidentalmente en React.
 * Convierte 0, null, undefined a null para uso seguro en componentes.
 *
 * Uso: Aplicar a discount_percentage, sale_price, etc. antes de pasarlos a componentes.
 *
 * @param value - Valor numérico a normalizar
 * @returns null si el valor es 0, null o undefined; el valor original si es > 0
 */
export function normalizeNumericValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value === 0) {
    return null;
  }
  return value;
}

/**
 * Normaliza un producto para uso en componentes React.
 * Previene que valores como 0 en discount_percentage o sale_price causen renders incorrectos.
 *
 * @param product - Producto a normalizar
 * @returns Producto con valores numéricos normalizados
 */
export function normalizeProduct<T extends { discount_percentage?: number | null; sale_price?: number | null }>(product: T): T {
  return {
    ...product,
    discount_percentage: normalizeNumericValue(product.discount_percentage),
    sale_price: normalizeNumericValue(product.sale_price),
  };
}
