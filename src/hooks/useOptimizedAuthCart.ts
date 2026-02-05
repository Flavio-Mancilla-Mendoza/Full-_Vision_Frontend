// src/hooks/useOptimizedAuthCart.ts
// ⚠️ DEPRECATED: Este archivo existe solo por compatibilidad.
// Usa imports desde @/hooks/cart directamente.

// Re-export del hook principal con el nombre legacy
export { useCart as useOptimizedAuthCart } from "./cart";

// Re-export hooks secundarios con nombres legacy
export { useCartCount as useOptimizedAuthCartCount } from "./cart";
export { useIsInCart as useOptimizedIsInAuthCart } from "./cart";

// Re-export utilidades para casos de uso avanzados
export { calculateCartSummary, calculateProductPrice, type CartSummary } from "./cart";
