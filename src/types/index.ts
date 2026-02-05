// src/types/index.ts - Tipos compartidos de la aplicación
import { Database } from "./database";

// Alias de tipos de base de datos para facilitar el uso
export type DbProduct = Database["public"]["Tables"]["products"]["Row"];
export type DbCartItem = Database["public"]["Tables"]["cart_items"]["Row"];
export type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
export type DbOrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbAppointment = Database["public"]["Tables"]["eye_exam_appointments"]["Row"];
export type DbLocation = Database["public"]["Tables"]["eye_exam_locations"]["Row"];
export type DbProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];
export type DbBrand = Database["public"]["Tables"]["brands"]["Row"];
export type DbProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type DbSiteContent = Database["public"]["Tables"]["site_content"]["Row"];
export type DbAttributeType = Database["public"]["Tables"]["attribute_types"]["Row"];
export type DbAttributeValue = Database["public"]["Tables"]["attribute_values"]["Row"];
export type DbProductAttribute = Database["public"]["Tables"]["product_attributes"]["Row"];

// Tipos de inserción y actualización
export type DbProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type DbCartItemInsert = Database["public"]["Tables"]["cart_items"]["Insert"];
export type DbOrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type DbOrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type DbProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type DbAppointmentInsert = Database["public"]["Tables"]["eye_exam_appointments"]["Insert"];
export type DbLocationInsert = Database["public"]["Tables"]["eye_exam_locations"]["Insert"];

export type DbProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type DbCartItemUpdate = Database["public"]["Tables"]["cart_items"]["Update"];
export type DbOrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type DbOrderItemUpdate = Database["public"]["Tables"]["order_items"]["Update"];
export type DbProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type DbAppointmentUpdate = Database["public"]["Tables"]["eye_exam_appointments"]["Update"];
export type DbLocationUpdate = Database["public"]["Tables"]["eye_exam_locations"]["Update"];

// Tipo Json de la base de datos para uso en la aplicación
export type Json = Database["public"]["Tables"]["products"]["Row"]["base_price"] extends number
  ? string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
  : never;

// Interface para detalles de prescripción
export interface PrescriptionDetails {
  // Ojo derecho
  od_sphere?: number;
  od_cylinder?: number;
  od_axis?: number;
  od_add?: number;

  // Ojo izquierdo
  os_sphere?: number;
  os_cylinder?: number;
  os_axis?: number;
  os_add?: number;

  // Distancia pupilar
  pd?: number;
  pd_far?: number;
  pd_near?: number;

  // Información adicional
  notes?: string;
  prescription_date?: string;
  expiry_date?: string;

  // Indice para compatibilidad con Json
  [key: string]: Json | undefined;
}

// Status types matching database
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "ready_for_pickup";
export type AppointmentStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type UserRole = "admin" | "customer";

// Productos con tipos extendidos
export interface OpticalProduct extends DbProduct {
  category?: DbProductCategory;
  brand?: DbBrand;
  product_images?: DbProductImage[];
  deleted_at?: string | null;
}

// Tipo para productos tal como vienen de Supabase con joins
export interface ProductWithRelations extends DbProduct {
  category: DbProductCategory | null;
  brand: DbBrand | null;
  product_images: DbProductImage[] | null;
}

// Marca y categoría (tipos de dominio reutilizables)
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Perfil de usuario con tipos consistentes
export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

// Orden con items incluidos
export interface Order extends Omit<DbOrder, "status"> {
  status: OrderStatus;
  order_items?: OrderItem[];
  customer_dni?: string | null; // Campo opcional para pedidos con retiro en tienda
}

// Item de orden
export interface OrderItem extends DbOrderItem {
  product?: OpticalProduct;
}

// Item del carrito con producto
export interface CartItemWithProduct extends Omit<DbCartItem, "prescription_details"> {
  product: OpticalProduct | null;
  prescription_details: PrescriptionDetails | null;
}

// Cita con ubicación incluida
export interface UserAppointment extends Omit<DbAppointment, "status"> {
  status: "pending" | "confirmed" | "cancelled" | "completed";
  eye_exam_locations?: DbLocation | null;
}

// Para calendario de citas
export interface CalendarAppointment extends Omit<DbAppointment, "status"> {
  status: AppointmentStatus;
  eye_exam_locations: DbLocation | null;
}

// Resultados de examen
export interface ExamResults {
  visual_acuity_od?: string;
  visual_acuity_os?: string;
  refraction_od?: PrescriptionDetails;
  refraction_os?: PrescriptionDetails;
  intraocular_pressure_od?: number;
  intraocular_pressure_os?: number;
  notes?: string;
  // Indice para compatibilidad con Json
  [key: string]: Json | undefined;
}

// Location type
// Export para uso en componentes
export * from "./database";
export * from "./appointments";
export * from "./attributes";
