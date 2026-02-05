import { supabase } from "@/lib/supabase";

export interface DynamicAttribute {
  slug: string;
  display_name: string;
  values: {
    value: string;
    display_name: string;
    color_hex?: string;
    count?: number;
  }[];
}

// Obtener atributos dinámicos con conteo de productos por género
export const getDynamicAttributesForGender = async (gender: string): Promise<DynamicAttribute[]> => {
  try {
    // 1. Obtener todos los tipos de atributos filtrables
    const { data: attributeTypes, error: typesError } = await supabase
      .from("attribute_types")
      .select(
        `
        id,
        slug,
        display_name,
        sort_order,
        attribute_values (
          id,
          value,
          display_name,
          color_hex,
          sort_order
        )
      `
      )
      .eq("is_active", true)
      .eq("is_filterable", true)
      .order("sort_order");

    if (typesError) throw typesError;

    // 2. Obtener productos del género con sus atributos
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        `
        id,
        product_attributes!inner (
          attribute_value_id
        )
      `
      )
      .eq("gender", gender)
      .eq("is_active", true);

    if (productsError) throw productsError;

    // 3. Contar productos por cada atributo
    const attributeValueCounts = new Map<string, number>();

    interface ProductWithAttributes {
      id: string;
      product_attributes?: { attribute_value_id: string }[];
    }

    (products as ProductWithAttributes[])?.forEach((product) => {
      product.product_attributes?.forEach((pa) => {
        const currentCount = attributeValueCounts.get(pa.attribute_value_id) || 0;
        attributeValueCounts.set(pa.attribute_value_id, currentCount + 1);
      });
    });

    // 4. Estructurar respuesta con conteos
    interface AttributeType {
      id: string;
      slug: string;
      display_name: string;
      attribute_values?: AttributeValue[];
    }

    interface AttributeValue {
      id: string;
      value: string;
      display_name: string;
      color_hex?: string;
      sort_order?: number;
    }

    const dynamicAttributes: DynamicAttribute[] =
      (attributeTypes as AttributeType[])
        ?.map((type) => ({
          slug: type.slug,
          display_name: type.display_name,
          values:
            type.attribute_values
              ?.filter((v) => (attributeValueCounts.get(v.id) ?? 0) > 0) // Solo valores con productos
              ?.map((value) => ({
                value: value.value,
                display_name: value.display_name,
                color_hex: value.color_hex,
                count: attributeValueCounts.get(value.id) || 0,
              }))
              ?.sort((a, b) => (b.count || 0) - (a.count || 0)) || [], // Ordenar por cantidad
        }))
        ?.filter((attr) => attr.values.length > 0) || []; // Solo atributos con valores

    return dynamicAttributes;
  } catch (error) {
    console.error("Error fetching dynamic attributes:", error);
    return [];
  }
};

// Obtener IDs de valores de atributos por slug y valores
export const getAttributeValueIds = async (attributeSlug: string, values: string[]): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("attribute_values")
      .select(
        `
        id,
        attribute_types!inner (slug)
      `
      )
      .eq("attribute_types.slug", attributeSlug)
      .in("value", values);

    if (error) throw error;

    interface ValueWithType {
      id: string;
    }

    return (data as ValueWithType[])?.map((d) => d.id) || [];
  } catch (error) {
    console.error("Error fetching attribute value IDs:", error);
    return [];
  }
};

// Obtener productos filtrados por atributos dinámicos
export const getProductsByDynamicAttributes = async (
  gender: string,
  attributeFilters: Record<string, string[]> // { 'frame_material': ['metal', 'acetato'], 'frame_size': ['m', 'l'] }
): Promise<unknown[]> => {
  try {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(id, name, slug)
      `
      )
      .eq("gender", gender)
      .eq("is_active", true);

    // Aplicar filtros de atributos
    const filterSlugs = Object.keys(attributeFilters);

    if (filterSlugs.length > 0) {
      // Para cada tipo de atributo con filtros
      for (const slug of filterSlugs) {
        const values = attributeFilters[slug];
        if (values.length > 0) {
          // Obtener IDs de los valores de atributo
          const valueIds = await getAttributeValueIds(slug, values);

          if (valueIds.length > 0) {
            // Filtrar productos que tengan al menos uno de estos atributos
            query = query.in("product_attributes.attribute_value_id", valueIds);
          }
        }
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching products by dynamic attributes:", error);
    return [];
  }
};
