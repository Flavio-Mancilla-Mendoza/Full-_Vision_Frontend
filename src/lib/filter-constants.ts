/**
 * Constantes de filtros estáticos para productos
 * Valores establecidos para color, forma y material de monturas
 */

// Rangos de precio predefinidos
export const PRICE_RANGES = [
  { label: "Todos los precios", min: 0, max: 999999 },
  { label: "Hasta S/ 200", min: 0, max: 200 },
  { label: "S/ 200 - S/ 500", min: 200, max: 500 },
  { label: "S/ 500 - S/ 1,000", min: 500, max: 1000 },
  { label: "Más de S/ 1,000", min: 1000, max: 999999 },
];

export const COLOR_OPTIONS = [
  { value: "negro", label: "Negro" },
  { value: "marrón", label: "Marrón" },
  { value: "azul", label: "Azul" },
  { value: "dorado", label: "Dorado" },
  { value: "plateado", label: "Plateado" },
  { value: "rojo", label: "Rojo" },
  { value: "verde", label: "Verde" },
  { value: "transparente", label: "Transparente" },
  { value: "carey", label: "Carey" },
  { value: "rosado", label: "Rosado" },
];

export const SHAPE_OPTIONS = [
  { value: "rectangular", label: "Rectangular" },
  { value: "cuadrado", label: "Cuadrado" },
  { value: "redondo", label: "Redondo" },
  { value: "aviador", label: "Aviador" },
  { value: "cat-eye", label: "Cat Eye" },
  { value: "ovalado", label: "Ovalado" },
  { value: "wayfarer", label: "Wayfarer" },
  { value: "deportivo", label: "Deportivo" },
  { value: "mariposa", label: "Mariposa" },
];

export const MATERIAL_OPTIONS = [
  { value: "metal", label: "Metal" },
  { value: "acetato", label: "Acetato" },
  { value: "titanio", label: "Titanio" },
  { value: "TR90", label: "TR90" },
  { value: "nylon", label: "Nylon" },
  { value: "acero inoxidable", label: "Acero Inoxidable" },
  { value: "mixto", label: "Mixto" },
  { value: "plastico", label: "Plástico" },
];
