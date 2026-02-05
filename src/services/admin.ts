// src/services/admin.ts - Re-export desde módulo modularizado
// Este archivo mantiene compatibilidad hacia atrás
// La lógica real está en src/services/admin/

export * from "./admin/index";

// Legacy type exports para compatibilidad
import type {
  OpticalProduct as GlobalOpticalProduct,
  Order as GlobalOrder,
  OrderItem as GlobalOrderItem,
} from "@/types";

export type OpticalProduct = GlobalOpticalProduct;
export type Order = GlobalOrder;
export type OrderItem = GlobalOrderItem;

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

// Re-export types from @/types for backward compatibility
export type { ProductCategory, Brand } from "@/types";
