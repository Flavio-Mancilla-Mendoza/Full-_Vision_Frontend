// src/services/productAttributes.ts - Servicio CRUD para atributos de productos
import { supabase } from "@/lib/supabase";
import type {
  AttributeType,
  AttributeValue,
  ProductAttribute,
  AttributeTypeWithValues,
  HybridFilters,
} from "@/types";
import { Database } from "@/types/database";

// Re-export tipos para compatibilidad
export type { AttributeType, AttributeValue, ProductAttribute, AttributeTypeWithValues };

// ===================================
// ATTRIBUTE TYPES CRUD
// ===================================

export async function getAttributeTypes(): Promise<AttributeTypeWithValues[]> {
  const { data, error } = await supabase
    .from("attribute_types")
    .select(
      `
      *,
      attribute_values(*)
    `
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("sort_order", { referencedTable: "attribute_values" });

  if (error) throw error;
  return data || [];
}

export async function createAttributeType(
  attributeType: Database["public"]["Tables"]["attribute_types"]["Insert"]
): Promise<AttributeType> {
  const { data, error } = await supabase.from("attribute_types").insert(attributeType).select().single();

  if (error) throw error;
  return data;
}

export async function updateAttributeType(id: string, updates: Partial<AttributeType>): Promise<AttributeType> {
  const { data, error } = await supabase.from("attribute_types").update(updates).eq("id", id).select().single();

  if (error) throw error;
  return data;
}

export async function deleteAttributeType(id: string): Promise<void> {
  const { error } = await supabase.from("attribute_types").update({ is_active: false }).eq("id", id);

  if (error) throw error;
}

// ===================================
// ATTRIBUTE VALUES CRUD
// ===================================

export async function getAttributeValues(attributeTypeId: string): Promise<AttributeValue[]> {
  const { data, error } = await supabase
    .from("attribute_values")
    .select("*")
    .eq("attribute_type_id", attributeTypeId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data || [];
}

export async function createAttributeValue(
  attributeValue: Database["public"]["Tables"]["attribute_values"]["Insert"]
): Promise<AttributeValue> {
  const { data, error } = await supabase.from("attribute_values").insert(attributeValue).select().single();

  if (error) throw error;
  return data;
}

export async function updateAttributeValue(id: string, updates: Partial<AttributeValue>): Promise<AttributeValue> {
  const { data, error } = await supabase.from("attribute_values").update(updates).eq("id", id).select().single();

  if (error) throw error;
  return data;
}

export async function deleteAttributeValue(id: string): Promise<void> {
  const { error } = await supabase.from("attribute_values").update({ is_active: false }).eq("id", id);

  if (error) throw error;
}

// ===================================
// PRODUCT ATTRIBUTES CRUD
// ===================================

export async function getProductAttributes(productId: string): Promise<ProductAttribute[]> {
  const { data, error } = await supabase
    .from("product_attributes")
    .select(
      `
      *,
      attribute_types!inner(slug, display_name),
      attribute_values!inner(value, display_name)
    `
    )
    .eq("product_id", productId)
    .eq("is_active", true);

  if (error) throw error;
  return data || [];
}

export async function setProductAttributes(
  productId: string,
  attributes: Array<{
    attribute_type_id: string;
    attribute_value_id: string;
    custom_value?: string;
  }>
): Promise<void> {
  // Primero desactivar todos los atributos existentes
  await supabase.from("product_attributes").update({ is_active: false }).eq("product_id", productId);

  // Luego insertar los nuevos
  if (attributes.length > 0) {
    const { error } = await supabase.from("product_attributes").insert(
      attributes.map((attr) => ({
        product_id: productId,
        ...attr,
        is_active: true,
      }))
    );

    if (error) throw error;
  }
}

// ===================================
// FILTROS HÍBRIDOS
// ===================================

/**
 * Obtiene filtros disponibles basados en los productos activos
 * Combina filtros fijos (columnas del esquema) con dinámicos (sistema de atributos)
 */
export async function getHybridFilters(): Promise<HybridFilters> {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("frame_material, lens_type, frame_style, frame_size, lens_color, frame_color, gender")
      .eq("is_active", true);

    if (error) throw error;

    const fixed_filters = {
      frame_materials: [...new Set(products.map((p) => p.frame_material).filter(Boolean))] as string[],
      lens_types: [...new Set(products.map((p) => p.lens_type).filter(Boolean))] as string[],
      frame_styles: [...new Set(products.map((p) => p.frame_style).filter(Boolean))] as string[],
      frame_sizes: [...new Set(products.map((p) => p.frame_size).filter(Boolean))] as string[],
      lens_colors: [...new Set(products.map((p) => p.lens_color).filter(Boolean))] as string[],
      frame_colors: [...new Set(products.map((p) => p.frame_color).filter(Boolean))] as string[],
      genders: [...new Set(products.map((p) => p.gender).filter(Boolean))] as string[],
    };

    // TODO: Agregar filtros dinámicos cuando se implemente el sistema completo
    return {
      fixed_filters,
      dynamic_filters: {},
    };
  } catch (error) {
    console.error("Error obteniendo filtros:", error);
    return {
      fixed_filters: {
        frame_materials: [],
        lens_types: [],
        frame_styles: [],
        frame_sizes: [],
        lens_colors: [],
        frame_colors: [],
        genders: [],
      },
      dynamic_filters: {},
    };
  }
}
