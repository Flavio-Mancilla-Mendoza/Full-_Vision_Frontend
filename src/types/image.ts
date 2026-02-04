// Tipos globales para carga y manipulación de imágenes

export interface UploadingImage {
  id?: string;
  product_id?: string;
  url: string;
  s3_key?: string; // Storage key (path in bucket)
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
  file?: File;
  uploading?: boolean;
  progress?: number;
  status?: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
}

import type { DbProductImage as ProductImage } from "@/types";
import type { CompressionType } from "@/utils/image-compression";
import type { ImageType } from "@/utils/multi-size-upload";

export interface ImageUploadProps {
  productId?: string;
  existingImages?: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  compressionType?: CompressionType;
  enableAutoOptimization?: boolean;
  imageType?: ImageType;
  enableMultiSize?: boolean;
  deferUpload?: boolean; // Si true, no sube a S3 hasta que se llame uploadPendingImages()
  onPendingImagesChange?: (files: File[]) => void; // Callback para archivos pendientes
}
