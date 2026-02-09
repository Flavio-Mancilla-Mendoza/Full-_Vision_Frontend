// src/services/admin/images.ts - Gestión de imágenes de productos (Admin)
import { supabase } from "@/lib/supabase";
import * as api from "@/services/api";
import { getAuthToken } from "./helpers";
import type { DbProductImage as ProductImage } from "@/types";

// Re-export type
export type { ProductImage };

/**
 * Obtener imágenes de un producto (interno)
 */
async function getProductImagesInternal(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Obtener imágenes de un producto
 */
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  try {
    const res = await fetch(`${api.getApiUrl()}/products/${productId}`);
    if (!res.ok) return [];
    const product = await res.json();
    return (product && product.product_images) || [];
  } catch (err) {
    console.error("Error fetching product images via API:", err);
    return getProductImagesInternal(productId);
  }
}

/**
 * Subir imagen a S3 usando presigned URL
 */
export async function uploadProductImage(file: File, productId?: string): Promise<{ s3Key: string; url: string }> {
  try {
    const response = await fetch(`${api.getApiUrl()}/products/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const { uploadUrl, s3Key } = await response.json();

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to S3: ${uploadResponse.status}`);
    }

    const bucket = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    return {
      s3Key,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}

/**
 * Eliminar imagen de S3 vía Lambda
 */
export async function deleteProductImageFromS3(s3Key: string): Promise<void> {
  try {
    if (!s3Key) return;

    const encodedKey = encodeURIComponent(s3Key);
    const response = await fetch(`${api.getApiUrl()}/products/images/${encodedKey}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error eliminando imagen de S3: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error en deleteProductImageFromS3:", error);
    throw error;
  }
}

/**
 * Eliminar imagen del storage (legacy compatibility)
 */
export async function deleteProductImageFromStorage(imageUrl: string): Promise<void> {
  try {
    if (imageUrl.includes(".s3.") || imageUrl.includes("amazonaws.com") || imageUrl.includes("cloudfront.net")) {
      const match = imageUrl.match(/\/products\/(.+?)(?:\?.*)?$/);
      if (match) {
        const s3Key = `products/${match[1]}`;
        await deleteProductImageFromS3(s3Key);
      }
    } else if (imageUrl.startsWith("products/")) {
      // Already an s3Key
      await deleteProductImageFromS3(imageUrl);
    } else {
      const urlParts = imageUrl.split("/storage/v1/object/public/products/");
      if (urlParts.length === 2) {
        console.warn("Imagen legacy de Supabase Storage. No se eliminará físicamente.");
      }
    }
  } catch (error) {
    console.warn("Error en deleteProductImageFromStorage:", error);
  }
}

/**
 * Crear registro de imagen en la base de datos
 */
export async function createProductImageRecord(
  productId: string,
  imageData: {
    url: string;
    s3_key?: string;
    alt_text?: string;
    sort_order: number;
    is_primary: boolean;
  }
): Promise<ProductImage> {
  const { data, error } = await supabase
    .from("product_images")
    .insert([
      {
        product_id: productId,
        url: imageData.url,
        s3_key: imageData.s3_key,
        alt_text: imageData.alt_text,
        sort_order: imageData.sort_order,
        is_primary: imageData.is_primary,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualizar imagen en la base de datos
 */
export async function updateProductImageRecord(
  imageId: string,
  updates: {
    url?: string;
    s3_key?: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }
): Promise<ProductImage> {
  const { data, error } = await supabase.from("product_images").update(updates).eq("id", imageId).select().single();

  if (error) throw error;
  return data;
}

/**
 * Eliminar imagen de la base de datos
 */
export async function deleteProductImageRecord(imageId: string): Promise<void> {
  const { data, error } = await supabase.from("product_images").delete().eq("id", imageId).select().single();

  if (error) throw error;

  if (data && data.url) {
    try {
      await deleteProductImageFromStorage(data.url);
    } catch (error) {
      console.warn("Error eliminando imagen del storage:", error);
    }
  }
}

/**
 * Configurar imagen como principal
 */
export async function setProductPrimaryImage(productId: string, imageId: string): Promise<void> {
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);

  const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);

  if (error) throw error;
}

/**
 * Corregir URLs de imágenes rotas
 */
export async function fixBrokenImageUrls(): Promise<{ fixed: number; errors: number }> {
  try {
    const { data: images, error } = await supabase.from("product_images").select("id, url, s3_key").not("url", "is", null);

    if (error) throw error;

    if (!images || images.length === 0) {
      return { fixed: 0, errors: 0 };
    }

    let fixed = 0;
    let errors = 0;

    const bucket = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";
    const cloudFrontUrl = import.meta.env.VITE_IMAGES_BASE_URL;

    if (!bucket) {
      throw new Error("VITE_AWS_S3_IMAGES_BUCKET no está configurado");
    }

    if (!cloudFrontUrl) {
      throw new Error("VITE_IMAGES_BASE_URL (CloudFront) no está configurado");
    }

    const extractS3Key = (url: string): string | null => {
      try {
        const s3Pattern = /https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/;
        const s3Match = url.match(s3Pattern);
        if (s3Match) return s3Match[1];

        if (url.startsWith(cloudFrontUrl)) {
          return url.replace(cloudFrontUrl + "/", "");
        }

        if (!url.startsWith("http")) {
          return url;
        }

        return null;
      } catch {
        return null;
      }
    };

    for (const image of images) {
      try {
        let needsFix = false;
        let correctedUrl = image.url;
        let correctedS3Key = image.s3_key;

        const s3Key = extractS3Key(image.url);

        if (s3Key) {
          const baseUrl = `${cloudFrontUrl}/${s3Key}`;
          const params = new URLSearchParams();

          if (!s3Key.toLowerCase().endsWith(".webp")) {
            params.set("format", "webp");
          }

          correctedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
          correctedS3Key = s3Key;

          if (correctedUrl !== image.url) {
            needsFix = true;
          }
        } else if (!image.url.startsWith("http") && !image.url.startsWith("//")) {
          needsFix = true;
          const key = image.url;
          const baseUrl = `${cloudFrontUrl}/${key}`;
          const params = new URLSearchParams();

          if (!key.toLowerCase().endsWith(".webp")) {
            params.set("format", "webp");
          }

          correctedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
          correctedS3Key = key;
        }

        if (needsFix) {
          const { error: updateError } = await supabase
            .from("product_images")
            .update({
              url: correctedUrl,
              s3_key: correctedS3Key,
            })
            .eq("id", image.id);

          if (updateError) {
            console.error(`Error actualizando imagen ${image.id}:`, updateError);
            errors++;
          } else {
            fixed++;
          }
        }
      } catch (imageError) {
        console.error(`Error procesando imagen ${image.id}:`, imageError);
        errors++;
      }
    }

    return { fixed, errors };
  } catch (error) {
    console.error("Error en fixBrokenImageUrls:", error);
    throw error;
  }
}
