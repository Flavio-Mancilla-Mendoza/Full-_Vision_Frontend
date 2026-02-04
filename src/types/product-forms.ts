import type { DbProductImage } from "./image";

export interface ProductFormData {
  name: string;
  description: string;
  slug: string;
  base_price: number;
  discount_percentage: number;
  is_active: boolean;
  stock_quantity: number;
  min_stock_level: number;
  sku: string;
  brand_id?: string;
  frame_material?: string;
  lens_type?: string;
  frame_style?: string;
  frame_size?: string;
  lens_color?: string;
  frame_color?: string;
  gender?: string;
  has_uv_protection: boolean;
  has_blue_filter: boolean;
  is_photochromic: boolean;
  has_anti_reflective: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  image_url?: string;
}

export type CreateProductPayload = Omit<ProductFormData, "image_url"> & {
  // image uploads handled separately
};

export type UpdateProductPayload = Partial<CreateProductPayload> & { id?: string };

export type ProductImage = DbProductImage;

export default ProductFormData;
