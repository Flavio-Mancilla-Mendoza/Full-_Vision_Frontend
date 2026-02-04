import { supabase } from "@/lib/supabase";
import { DbAttributeType, DbAttributeValue, DbProductAttribute } from "@/types";
import { Database } from "@/types/database";

// ===================================
// INTERFACES ACTUALIZADAS PARA SISTEMA HÍBRIDO
// ===================================

export type AttributeType = DbAttributeType;
export type AttributeValue = DbAttributeValue;
export type ProductAttribute = DbProductAttribute;

export interface AttributeTypeWithValues extends DbAttributeType {
  attribute_values: DbAttributeValue[];
}

export interface ProductWithAttributes {
  id: string;
  name: string;
  slug: string;
  main_image_url: string;
  price: number;
  brand_name: string;
  main_category_name: string;
  attributes: Record<
    string,
    {
      type: string;
      value: string;
      display_name: string;
      color_hex?: string;
    }
  >;
  attribute_values: string[];
}

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
// FILTROS Y BÚSQUEDA
// ===================================

export interface FilterOption {
  type: string;
  name: string;
  options: Array<{
    value: string;
    display_name: string;
    count: number;
    color_hex?: string;
  }>;
}

export async function getAvailableFilters(): Promise<FilterOption[]> {
  // NOTA: Esta función requiere la función RPC get_available_filters en la base de datos
  // Por ahora retornamos un array vacío hasta que se cree la función
  console.warn("get_available_filters RPC function does not exist yet");
  return [];

  /* TODO: Descomentar cuando se cree la función RPC
  const { data, error } = await supabase.rpc("get_available_filters");

  if (error) throw error;
  return data || [];
  */
}

export interface ProductFilters {
  brand?: string;
  main_category?: string;
  attributes?: Record<string, string[]>;
  price_range?: [number, number];
  search?: string;
}

export async function getFilteredProducts(filters: ProductFilters): Promise<ProductWithAttributes[]> {
  // NOTA: Esta función requiere la vista products_with_attributes en la base de datos
  // Por ahora retornamos un array vacío hasta que se cree la vista
  console.warn("products_with_attributes view does not exist yet");
  return [];

  /* TODO: Descomentar cuando se cree la vista products_with_attributes
  let query = supabase.from("products_with_attributes").select("*");

  // Filtro por marca
  if (filters.brand) {
    query = query.eq("brand_name", filters.brand);
  }

  // Filtro por categoría principal
  if (filters.main_category) {
    query = query.eq("main_category_name", filters.main_category);
  }

  // Filtro por rango de precio
  if (filters.price_range) {
    query = query.gte("price", filters.price_range[0]).lte("price", filters.price_range[1]);
  }

  // Búsqueda por texto
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  let results = data || [];

  // Filtrar por atributos (lógica en JavaScript para mayor flexibilidad)
  if (filters.attributes) {
    Object.entries(filters.attributes).forEach(([attributeType, values]) => {
      if (values.length > 0) {
        results = results.filter((product) => values.some((value) => product.attribute_values.includes(value)));
      }
    });
  }

  return results;
  */
}

// ===================================
// REACT HOOKS
// ===================================

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export function useAttributeTypes() {
  const [attributeTypes, setAttributeTypes] = useState<AttributeTypeWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAttributeTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttributeTypes();
      setAttributeTypes(data);
    } catch (error: unknown) {
      console.error("Error loading attribute types:", error);

      let errorMessage = "No se pudieron cargar los tipos de atributos";

      // Detectar errores específicos
      if (error instanceof Error) {
        if (error.message.includes('relation "attribute_types" does not exist')) {
          errorMessage = "Las tablas de atributos no existen. Ejecute la migración híbrida primero.";
        } else if (error.message.includes("row-level security policy")) {
          errorMessage = "Políticas de seguridad incorrectas. Ejecute el script de corrección.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAttributeTypes();
  }, [loadAttributeTypes]);

  const createType = async (typeData: Omit<AttributeType, "id" | "created_at">) => {
    try {
      await createAttributeType(typeData);
      await loadAttributeTypes();
      toast({
        title: "Éxito",
        description: "Tipo de atributo creado correctamente",
      });
    } catch (error) {
      console.error("Error creating attribute type:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el tipo de atributo",
        variant: "destructive",
      });
    }
  };

  const updateType = async (id: string, updates: Partial<AttributeType>) => {
    try {
      await updateAttributeType(id, updates);
      await loadAttributeTypes();
      toast({
        title: "Éxito",
        description: "Tipo de atributo actualizado correctamente",
      });
    } catch (error) {
      console.error("Error updating attribute type:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de atributo",
        variant: "destructive",
      });
    }
  };

  const deleteType = async (id: string) => {
    try {
      await deleteAttributeType(id);
      await loadAttributeTypes();
      toast({
        title: "Éxito",
        description: "Tipo de atributo eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting attribute type:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de atributo",
        variant: "destructive",
      });
    }
  };

  return {
    attributeTypes,
    loading,
    error,
    createType,
    updateType,
    deleteType,
    reload: loadAttributeTypes,
  };
}

export function useProductFilters() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [products, setProducts] = useState<ProductWithAttributes[]>([]);
  const [availableFilters, setAvailableFilters] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAvailableFilters = useCallback(async () => {
    try {
      const data = await getAvailableFilters();
      setAvailableFilters(data);
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  }, []);

  const searchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFilteredProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAvailableFilters();
  }, [loadAvailableFilters]);

  useEffect(() => {
    searchProducts();
  }, [searchProducts]);

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    filters,
    products,
    availableFilters,
    loading,
    updateFilters,
    clearFilters,
    searchProducts,
  };
}

// ===================================
// NUEVAS FUNCIONES PARA SISTEMA HÍBRIDO
// ===================================

// Estructura de filtros híbrida (fijos + dinámicos)
export interface HybridFilters {
  // Filtros fijos (del esquema existente)
  fixed_filters: {
    frame_materials: string[];
    lens_types: string[];
    frame_styles: string[];
    frame_sizes: string[];
    lens_colors: string[];
    frame_colors: string[];
    genders: string[];
  };
  // Filtros dinámicos (del nuevo sistema)
  dynamic_filters: Record<
    string,
    {
      display_name: string;
      filter_group: string;
      options: Array<{
        value: string;
        display_name: string;
        color_hex?: string;
      }>;
    }
  >;
}

// Obtener todos los filtros disponibles (fijos + dinámicos)
export async function getHybridFilters(): Promise<HybridFilters> {
  // NOTA: La función RPC get_all_available_filters no existe aún
  // Por ahora usamos fallback a filtros básicos
  console.warn("get_all_available_filters RPC function does not exist yet, using basic filters");
  return await getBasicFilters();

  /* TODO: Descomentar cuando se cree la función RPC
  const { data, error } = await supabase.rpc("get_all_available_filters");

  if (error) {
    console.warn("Error obteniendo filtros híbridos, usando fallback:", error);
    // Fallback a filtros básicos si la función SQL no existe
    return await getBasicFilters();
  }

  return data || { fixed_filters: {}, dynamic_filters: {} };
  */
}

// Función fallback para filtros básicos si no existe el sistema híbrido
async function getBasicFilters(): Promise<HybridFilters> {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("frame_material, lens_type, frame_style, frame_size, lens_color, frame_color, gender")
      .eq("is_active", true);

    if (error) throw error;

    const fixed_filters = {
      frame_materials: [...new Set(products.map((p) => p.frame_material).filter(Boolean))],
      lens_types: [...new Set(products.map((p) => p.lens_type).filter(Boolean))],
      frame_styles: [...new Set(products.map((p) => p.frame_style).filter(Boolean))],
      frame_sizes: [...new Set(products.map((p) => p.frame_size).filter(Boolean))],
      lens_colors: [...new Set(products.map((p) => p.lens_color).filter(Boolean))],
      frame_colors: [...new Set(products.map((p) => p.frame_color).filter(Boolean))],
      genders: [...new Set(products.map((p) => p.gender).filter(Boolean))],
    };

    return {
      fixed_filters,
      dynamic_filters: {},
    };
  } catch (error) {
    console.error("Error obteniendo filtros básicos:", error);
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
