// src/types/attributes.ts - Tipos para sistema de atributos de productos
import { DbAttributeType, DbAttributeValue, DbProductAttribute } from "./index";

// Re-export tipos base de DB
export type AttributeType = DbAttributeType;
export type AttributeValue = DbAttributeValue;
export type ProductAttribute = DbProductAttribute;

// Tipo de atributo con sus valores relacionados
export interface AttributeTypeWithValues extends DbAttributeType {
  attribute_values: DbAttributeValue[];
}

// Producto con atributos expandidos (para búsqueda/filtros)
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

// Opciones de filtro para UI
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

// Filtros de productos
export interface ProductFilters {
  brand?: string;
  main_category?: string;
  attributes?: Record<string, string[]>;
  price_range?: [number, number];
  search?: string;
}

// Filtros híbridos (fijos del esquema + dinámicos)
export interface HybridFilters {
  fixed_filters: {
    frame_materials: string[];
    lens_types: string[];
    frame_styles: string[];
    frame_sizes: string[];
    lens_colors: string[];
    frame_colors: string[];
    genders: string[];
  };
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
