export interface IProduct {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  sku: string | null;
  base_price: number;
  sale_price: number | null;
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
  is_photochromic: boolean | null;
  has_anti_reflective: boolean | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  is_bestseller: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
  deleted_at: string | null;
  discount_percentage: number | null;
  // Relaciones expandidas (opcional)
  category?: IProductCategory | null;
  brand?: {
    name: string;
  } | null;
  product_images?: Array<{
    id: string;
    url: string;
    s3_key: string;
    alt_text: string;
    is_primary: boolean;
    sort_order: number;
  }>;
}

export interface IProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}
