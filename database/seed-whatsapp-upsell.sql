-- ================================================================
-- CONFIGURACIÓN DE UPSELL DE LUNAS POR WHATSAPP
-- Sección: whatsapp_upsell en site_content
-- ================================================================
-- Esta configuración se gestiona desde el panel admin (SiteContentManager)
-- y se consume en el frontend via GET /public/site-content/whatsapp_upsell

INSERT INTO site_content (section, content_type, key, value, alt_text, metadata) VALUES
(
  'whatsapp_upsell',
  'text',
  'enabled',
  'true',
  'Habilitar/deshabilitar el CTA de lunas por WhatsApp',
  '{"type": "boolean"}'
),
(
  'whatsapp_upsell',
  'text',
  'phone_number',
  '51930639641',
  'Número de WhatsApp sin + ni espacios (código país + número)',
  '{"format": "country_code + number"}'
),
(
  'whatsapp_upsell',
  'text',
  'title',
  '¿Necesitas lunas para tu montura?',
  'Título principal del CTA',
  '{"font_size": "large"}'
),
(
  'whatsapp_upsell',
  'text',
  'description',
  'Nuestros asesores pueden ayudarte a elegir las lunas ideales para tu montura: graduadas, progresivas, con filtro azul, fotocromáticas y más. ¡Contáctanos por WhatsApp!',
  'Descripción del CTA',
  '{"font_size": "medium"}'
),
(
  'whatsapp_upsell',
  'text',
  'button_text',
  'Hablar con un asesor',
  'Texto del botón de WhatsApp',
  null
),
(
  'whatsapp_upsell',
  'text',
  'message_template',
  '¡Hola! 👋\nAcabo de comprar en Full Vision (Pedido: {{order_number}}).\nMe gustaría cotizar lunas para: {{product_names}}.\n¿Podrían asesorarme sobre las opciones disponibles?',
  'Plantilla del mensaje. Variables: {{order_number}}, {{product_names}}',
  '{"variables": ["order_number", "product_names"]}'
),
(
  'whatsapp_upsell',
  'text',
  'category_slugs',
  'marcos,lentes-graduados,lentes-sol,filtro-luz-azul',
  'Slugs de categorías que activan el upsell (separados por coma)',
  '{"type": "csv"}'
),
(
  'whatsapp_upsell',
  'text',
  'response_time_text',
  'Respuesta promedio en menos de 15 minutos en horario de atención',
  'Texto informativo sobre tiempo de respuesta',
  null
)
ON CONFLICT (section, key) DO UPDATE SET
  value = EXCLUDED.value,
  alt_text = EXCLUDED.alt_text,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
