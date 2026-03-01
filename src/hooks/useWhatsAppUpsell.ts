// src/hooks/useWhatsAppUpsell.ts
// Hook que obtiene la configuración del upsell de lunas desde site_content (backend)
import { useMemo } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

export interface WhatsAppUpsellConfig {
  enabled: boolean;
  phoneNumber: string;
  title: string;
  description: string;
  buttonText: string;
  messageTemplate: string;
  categorySlugs: Set<string>;
  responseTimeText: string;
}

/** Default fallbacks while loading or if backend is unreachable */
const DEFAULTS: WhatsAppUpsellConfig = {
  enabled: true,
  phoneNumber: "51930639641",
  title: "¿Necesitas lunas para tu montura?",
  description:
    "Nuestros asesores pueden ayudarte a elegir las lunas ideales para tu montura: graduadas, progresivas, con filtro azul, fotocromáticas y más. ¡Contáctanos por WhatsApp!",
  buttonText: "Hablar con un asesor",
  messageTemplate:
    "¡Hola! 👋\nAcabo de comprar en Full Vision (Pedido: {{order_number}}).\nMe gustaría cotizar lunas para: {{product_names}}.\n¿Podrían asesorarme sobre las opciones disponibles?",
  categorySlugs: new Set(["marcos", "lentes-graduados", "lentes-sol", "filtro-luz-azul"]),
  responseTimeText: "Respuesta promedio en menos de 15 minutos en horario de atención",
};

/**
 * Build the WhatsApp URL with a pre-filled message based on order data.
 */
export function buildWhatsAppUrl(
  phoneNumber: string,
  messageTemplate: string,
  orderNumber?: string,
  productNames?: string[]
): string {
  const productList = productNames?.length ? productNames.join(", ") : "mi montura";

  const message = messageTemplate
    .replace("{{order_number}}", orderNumber || "N/A")
    .replace("{{product_names}}", productList);

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Determine whether the upsell should be visible based on the order's
 * product categories.
 */
export function shouldShowUpsell(
  categorySlugs: Set<string>,
  orderCategorySlugs: (string | null | undefined)[]
): boolean {
  return orderCategorySlugs.some((slug) => slug != null && categorySlugs.has(slug));
}

/**
 * Fetches WhatsApp upsell configuration from `site_content` (section: whatsapp_upsell).
 * Falls back to sensible defaults while loading or on error.
 */
export function useWhatsAppUpsell() {
  const { content, loading, getContentByKey } = useSiteContent("whatsapp_upsell");

  const config: WhatsAppUpsellConfig = useMemo(() => {
    // While loading or if no content returned, use defaults
    if (loading || content.length === 0) return DEFAULTS;

    const rawSlugs = getContentByKey("category_slugs", "");
    const slugSet = rawSlugs
      ? new Set(rawSlugs.split(",").map((s) => s.trim()).filter(Boolean))
      : DEFAULTS.categorySlugs;

    return {
      enabled: getContentByKey("enabled", "true") === "true",
      phoneNumber: getContentByKey("phone_number", DEFAULTS.phoneNumber),
      title: getContentByKey("title", DEFAULTS.title),
      description: getContentByKey("description", DEFAULTS.description),
      buttonText: getContentByKey("button_text", DEFAULTS.buttonText),
      messageTemplate: getContentByKey("message_template", DEFAULTS.messageTemplate),
      categorySlugs: slugSet,
      responseTimeText: getContentByKey("response_time_text", DEFAULTS.responseTimeText),
    };
  }, [content, loading, getContentByKey]);

  return { config, loading };
}
