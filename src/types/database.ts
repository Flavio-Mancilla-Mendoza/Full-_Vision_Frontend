/**
 * ⚠️ ARCHIVO DE TIPOS DE BASE DE DATOS
 * 
 * Tipos generados desde el esquema de Supabase
 * Para regenerar: npm run db:types
 * 
 * @see docs/DATABASE_TYPES_GUIDE.md para guía de uso
 */

// src/types/database.ts - Tipos de base de datos generados desde Supabase

/** Tipo para datos JSON en la base de datos */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          sku: string | null;
          base_price: number;
          sale_price: number | null;
          discount_percentage: number | null;
          category_id: string | null;
          brand_id: string | null;
          stock_quantity: number | null;
          min_stock_level: number | null;
          frame_material: string | null;
          lens_type: string | null;
          frame_style: string | null;
          frame_size: string | null;
          lens_color: string | null;
          frame_color: string | null;
          gender: string | null;
          bridge_width: number | null;
          temple_length: number | null;
          lens_width: number | null;
          has_uv_protection: boolean | null;
          has_blue_filter: boolean | null;
          is_polarized: boolean | null;
          is_photochromic: boolean | null;
          has_anti_reflective: boolean | null;
          prescription_compatible: boolean | null;
          weight_grams: number | null;
          country_origin: string | null;
          warranty_months: number | null;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_bestseller: boolean | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          slug: string;
          sku?: string | null;
          base_price: number;
          sale_price?: number | null;
          discount_percentage?: number | null;
          category_id?: string | null;
          brand_id?: string | null;
          stock_quantity?: number | null;
          min_stock_level?: number | null;
          frame_material?: string | null;
          lens_type?: string | null;
          frame_style?: string | null;
          frame_size?: string | null;
          lens_color?: string | null;
          frame_color?: string | null;
          gender?: string | null;
          bridge_width?: number | null;
          temple_length?: number | null;
          lens_width?: number | null;
          has_uv_protection?: boolean | null;
          has_blue_filter?: boolean | null;
          is_polarized?: boolean | null;
          is_photochromic?: boolean | null;
          has_anti_reflective?: boolean | null;
          prescription_compatible?: boolean | null;
          weight_grams?: number | null;
          country_origin?: string | null;
          warranty_months?: number | null;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_bestseller?: boolean | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          slug?: string;
          sku?: string | null;
          base_price?: number;
          sale_price?: number | null;
          discount_percentage?: number | null;
          category_id?: string | null;
          brand_id?: string | null;
          stock_quantity?: number | null;
          min_stock_level?: number | null;
          frame_material?: string | null;
          lens_type?: string | null;
          frame_style?: string | null;
          frame_size?: string | null;
          lens_color?: string | null;
          frame_color?: string | null;
          gender?: string | null;
          bridge_width?: number | null;
          temple_length?: number | null;
          lens_width?: number | null;
          has_uv_protection?: boolean | null;
          has_blue_filter?: boolean | null;
          is_polarized?: boolean | null;
          is_photochromic?: boolean | null;
          has_anti_reflective?: boolean | null;
          prescription_compatible?: boolean | null;
          weight_grams?: number | null;
          country_origin?: string | null;
          warranty_months?: number | null;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_bestseller?: boolean | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          s3_key?: string | null; // Storage key/path
          alt_text: string | null;
          sort_order: number | null;
          is_primary: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          s3_key?: string | null; // Storage key/path
          alt_text?: string | null;
          sort_order?: number | null;
          is_primary?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          s3_key?: string | null; // Storage key/path
          alt_text?: string | null;
          sort_order?: number | null;
          is_primary?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          order_number: string;
          status: string;
          subtotal: number;
          tax_amount: number | null;
          shipping_amount: number | null;
          discount_amount: number | null;
          total_amount: number;
          shipping_name: string | null;
          shipping_email: string | null;
          shipping_phone: string | null;
          shipping_address: string | null;
          shipping_city: string | null;
          shipping_postal_code: string | null;
          billing_name: string | null;
          billing_email: string | null;
          billing_address: string | null;
          billing_city: string | null;
          billing_postal_code: string | null;
          order_date: string;
          shipped_date: string | null;
          delivered_date: string | null;
          customer_notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          order_number: string;
          status?: string;
          subtotal: number;
          tax_amount?: number | null;
          shipping_amount?: number | null;
          discount_amount?: number | null;
          total_amount: number;
          shipping_name?: string | null;
          shipping_email?: string | null;
          shipping_phone?: string | null;
          shipping_address?: string | null;
          shipping_city?: string | null;
          shipping_postal_code?: string | null;
          billing_name?: string | null;
          billing_email?: string | null;
          billing_address?: string | null;
          billing_city?: string | null;
          billing_postal_code?: string | null;
          order_date?: string;
          shipped_date?: string | null;
          delivered_date?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          order_number?: string;
          status?: string;
          subtotal?: number;
          tax_amount?: number | null;
          shipping_amount?: number | null;
          discount_amount?: number | null;
          total_amount?: number;
          shipping_name?: string | null;
          shipping_email?: string | null;
          shipping_phone?: string | null;
          shipping_address?: string | null;
          shipping_city?: string | null;
          shipping_postal_code?: string | null;
          billing_name?: string | null;
          billing_email?: string | null;
          billing_address?: string | null;
          billing_city?: string | null;
          billing_postal_code?: string | null;
          order_date?: string;
          shipped_date?: string | null;
          delivered_date?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          prescription_details: Json | null;
          special_instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          prescription_details?: Json | null;
          special_instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          prescription_details?: Json | null;
          special_instructions?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          prescription_details: Json | null;
          special_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          prescription_details?: Json | null;
          special_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          prescription_details?: Json | null;
          special_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          address: string | null;
          role: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      eye_exam_locations: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          business_hours: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          business_hours?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          business_hours?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      eye_exam_appointments: {
        Row: {
          id: string;
          user_id: string | null;
          location_id: string | null;
          appointment_date: string;
          appointment_time: string;
          duration_minutes: number | null;
          status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
          exam_type: string | null;
          patient_name: string;
          patient_phone: string | null;
          patient_email: string | null;
          patient_age: number | null;
          reason_for_visit: string | null;
          has_insurance: boolean;
          insurance_provider: string | null;
          current_prescription: string | null;
          last_exam_date: string | null;
          medical_conditions: string | null;
          medications: string | null;
          exam_results: Json | null;
          prescription_issued: Json | null;
          recommendations: string | null;
          follow_up_needed: boolean;
          follow_up_date: string | null;
          patient_notes: string | null;
          doctor_notes: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          location_id?: string | null;
          appointment_date: string;
          appointment_time: string;
          duration_minutes?: number | null;
          status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
          exam_type?: string | null;
          patient_name: string;
          patient_phone?: string | null;
          patient_email?: string | null;
          patient_age?: number | null;
          reason_for_visit?: string | null;
          has_insurance?: boolean;
          insurance_provider?: string | null;
          current_prescription?: string | null;
          last_exam_date?: string | null;
          medical_conditions?: string | null;
          medications?: string | null;
          exam_results?: Json | null;
          prescription_issued?: Json | null;
          recommendations?: string | null;
          follow_up_needed?: boolean;
          follow_up_date?: string | null;
          patient_notes?: string | null;
          doctor_notes?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          location_id?: string | null;
          appointment_date?: string;
          appointment_time?: string;
          duration_minutes?: number | null;
          status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
          exam_type?: string | null;
          patient_name?: string;
          patient_phone?: string | null;
          patient_email?: string | null;
          patient_age?: number | null;
          reason_for_visit?: string | null;
          has_insurance?: boolean;
          insurance_provider?: string | null;
          current_prescription?: string | null;
          last_exam_date?: string | null;
          medical_conditions?: string | null;
          medications?: string | null;
          exam_results?: Json | null;
          prescription_issued?: Json | null;
          recommendations?: string | null;
          follow_up_needed?: boolean;
          follow_up_date?: string | null;
          patient_notes?: string | null;
          doctor_notes?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "eye_exam_appointments_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "eye_exam_locations";
            referencedColumns: ["id"];
          }
        ];
      };
      site_content: {
        Row: {
          id: string;
          section: string;
          content_type: string;
          key: string;
          value: string;
          alt_text: string | null;
          metadata: Json | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section: string;
          content_type: string;
          key: string;
          value: string;
          alt_text?: string | null;
          metadata?: Json | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section?: string;
          content_type?: string;
          key?: string;
          value?: string;
          alt_text?: string | null;
          metadata?: Json | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attribute_types: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          input_type: string;
          is_required: boolean;
          is_filterable: boolean;
          filter_group: string | null;
          display_name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          input_type: string;
          is_required?: boolean;
          is_filterable?: boolean;
          filter_group?: string | null;
          display_name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          input_type?: string;
          is_required?: boolean;
          is_filterable?: boolean;
          filter_group?: string | null;
          display_name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attribute_values: {
        Row: {
          id: string;
          attribute_type_id: string;
          value: string;
          display_name: string;
          color_hex: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attribute_type_id: string;
          value: string;
          display_name: string;
          color_hex?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attribute_type_id?: string;
          value?: string;
          display_name?: string;
          color_hex?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_type_id_fkey";
            columns: ["attribute_type_id"];
            isOneToOne: false;
            referencedRelation: "attribute_types";
            referencedColumns: ["id"];
          }
        ];
      };
      product_attributes: {
        Row: {
          id: string;
          product_id: string;
          attribute_type_id: string;
          attribute_value_id: string;
          custom_value: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          attribute_type_id: string;
          attribute_value_id: string;
          custom_value?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          attribute_type_id?: string;
          attribute_value_id?: string;
          custom_value?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attributes_attribute_type_id_fkey";
            columns: ["attribute_type_id"];
            isOneToOne: false;
            referencedRelation: "attribute_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attributes_attribute_value_id_fkey";
            columns: ["attribute_value_id"];
            isOneToOne: false;
            referencedRelation: "attribute_values";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      /** Vistas SQL definidas en la base de datos */
      [_ in never]: never;
    };
    Functions: {
      /** Funciones SQL/PL-PGSQL disponibles */
      [_ in never]: never;
    };
    Enums: {
      /** Enums de PostgreSQL - TODO: Migrar status a enums nativos */
      [_ in never]: never;
    };
    CompositeTypes: {
      /** Tipos compuestos de PostgreSQL */
      [_ in never]: never;
    };
  };
}

// ============================================
// TIPOS DERIVADOS Y HELPERS
// ============================================

/**
 * Estados de orden disponibles
 * TODO: Migrar a enum de PostgreSQL
 */
export type OrderStatus = 
  | "pending" 
  | "confirmed" 
  | "processing" 
  | "shipped" 
  | "delivered" 
  | "cancelled" 
  | "ready_for_pickup";

/**
 * Estados de cita disponibles
 * TODO: Migrar a enum de PostgreSQL
 */
export type AppointmentStatus = 
  | "scheduled" 
  | "confirmed" 
  | "in_progress" 
  | "completed" 
  | "cancelled";

/**
 * Roles de usuario disponibles
 * TODO: Migrar a enum de PostgreSQL
 */
export type UserRole = "admin" | "customer";

/**
 * Estructura de datos de prescripción médica
 * Usado en prescription_details (campos JSON)
 */
export interface PrescriptionData {
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
}

/**
 * Helper para campos de timestamp comunes
 */
export type TimestampFields = {
  created_at: string;
  updated_at: string;
};

/**
 * Helper para soft delete
 */
export type SoftDeleteFields = {
  deleted_at: string | null;
};

