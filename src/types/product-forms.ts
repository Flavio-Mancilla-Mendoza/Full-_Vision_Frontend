/**
 * Tipos para formularios de productos
 * Alineados con los tipos globales de la aplicación y el esquema de la base de datos
 */

import type { DbProduct, DbProductInsert, DbProductUpdate, DbProductImage } from "./index";

// ============================================
// TIPOS BASE PARA FORMULARIOS
// ============================================

/**
 * Datos de formulario para crear/editar productos
 * Basado en DbProduct pero adaptado para uso en formularios
 */
export interface ProductFormData {
  // Información básica (requerida)
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  
  // Información descriptiva
  description?: string;
  meta_title?: string;
  meta_description?: string;
  
  // Precios y descuentos
  sale_price?: number;
  discount_percentage?: number;
  
  // Relaciones
  category_id?: string;
  brand_id?: string;
  
  // Inventario
  stock_quantity?: number;
  min_stock_level?: number;
  
  // Atributos de producto
  frame_material?: string;
  lens_type?: string;
  frame_style?: string;
  frame_size?: string;
  lens_color?: string;
  frame_color?: string;
  gender?: string;
  
  // Medidas físicas (opcional)
  bridge_width?: number;
  temple_length?: number;
  lens_width?: number;
  
  // Características booleanas
  has_uv_protection?: boolean;
  has_blue_filter?: boolean;
  is_photochromic?: boolean;
  has_anti_reflective?: boolean;
  
  // Estado y destacados
  is_active?: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
  
  // Imagen principal (URL temporal o existente)
  image_url?: string;
}

// ============================================
// TIPOS PARA OPERACIONES CRUD
// ============================================

/**
 * Payload para crear un nuevo producto
 * Omite campos auto-generados y manejados por el backend
 */
export interface CreateProductPayload extends Omit<
  DbProductInsert,
  "id" | "created_at" | "updated_at" | "deleted_at"
> {
  // Campos adicionales del formulario si son necesarios
  image_url?: string;
}

/**
 * Payload para actualizar un producto existente
 * Todos los campos son opcionales excepto el ID
 */
export interface UpdateProductPayload extends Partial<
  Omit<DbProductUpdate, "id" | "created_at" | "updated_at" | "deleted_at">
> {
  id: string; // Requerido para actualización
}

// ============================================
// TIPOS PARA VALIDACIÓN
// ============================================

/**
 * Campos requeridos para validación de formulario
 */
export type RequiredProductFields = Pick<
  ProductFormData,
  "name" | "slug" | "sku" | "base_price"
>;

/**
 * Campos opcionales para validación de formulario
 */
export type OptionalProductFields = Omit<
  ProductFormData,
  keyof RequiredProductFields
>;

// ============================================
// TIPOS PARA IMÁGENES DE PRODUCTOS
// ============================================

/**
 * Re-exportar tipo de imagen de producto desde tipos globales
 */
export type ProductImage = DbProductImage;

/**
 * Payload para subir imagen de producto
 */
export interface ProductImageUpload {
  product_id: string;
  file: File;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

/**
 * Response de imagen subida
 */
export interface ProductImageUploadResponse {
  id: string;
  url: string;
  s3_key: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

// ============================================
// HELPERS Y UTILIDADES DE TIPO
// ============================================

/**
 * Convierte ProductFormData a DbProductInsert
 */
export type FormDataToInsert = (
  formData: ProductFormData
) => CreateProductPayload;

/**
 * Convierte ProductFormData a DbProductUpdate
 */
export type FormDataToUpdate = (
  formData: Partial<ProductFormData>,
  productId: string
) => UpdateProductPayload;
