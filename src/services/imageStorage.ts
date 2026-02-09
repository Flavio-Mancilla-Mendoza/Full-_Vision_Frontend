// Servicio para gestionar imágenes en S3 vía Lambda
import { fetchAuthSession } from "@aws-amplify/auth";

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "https://your-api-id.execute-api.sa-east-1.amazonaws.com/dev";

/**
 * Obtener JWT token de Cognito
 */
async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error("No authentication token available");
    }
    return token;
  } catch (error) {
    console.error("❌ Error getting auth token:", error);
    throw new Error("Authentication required");
  }
}

export interface UploadImageResult {
  success: boolean;
  url?: string;
  s3Key?: string;
  error?: string;
}

export interface PresignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Sube una imagen a S3 usando URLs pre-firmadas
 */
export async function uploadProductImage(file: File, folder: string = "products"): Promise<UploadImageResult> {
  try {
    // Validar archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Tipo de archivo no permitido. Usa: ${allowedTypes.join(", ")}`,
      };
    }

    // Validar tamaño (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Archivo muy grande. Máximo: 5MB, recibido: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // 1. Obtener URL pre-firmada del Lambda
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/products/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo URL de subida: ${response.status} - ${errorText}`);
    }

    const uploadData: { uploadUrl: string; s3Key: string; fileName: string } = await response.json();

    // 2. Subir archivo directamente a S3
    const uploadResponse = await fetch(uploadData.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error subiendo a S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Generar URL completa de CloudFront para consistencia
    const cloudFrontUrl = import.meta.env.VITE_IMAGES_BASE_URL;
    const fullUrl = cloudFrontUrl ? `${cloudFrontUrl}/${uploadData.s3Key}?format=webp` : uploadData.s3Key;

    return {
      success: true,
      s3Key: uploadData.s3Key,
      url: fullUrl, // Retornar URL completa de CloudFront en lugar de solo el key
    };
  } catch (error) {
    console.error("Error inesperado:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina una imagen de S3 vía Lambda
 */
export async function deleteProductImage(s3Key: string): Promise<UploadImageResult> {
  try {
    if (!s3Key) {
      return {
        success: false,
        error: "s3Key no proporcionado",
      };
    }

    const token = await getAuthToken();
    const encodedKey = encodeURIComponent(s3Key);

    const response = await fetch(`${API_URL}/products/images/${encodedKey}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error eliminando imagen: ${response.status} - ${errorData}`);
    }

    return {
      success: true,
      s3Key,
    };
  } catch (error) {
    console.error("Error eliminando imagen de S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Obtiene una URL pública para una imagen
 * Si CloudFront está configurado, usa CloudFront; sino, usa S3 directo
 * Nota: Las URLs pre-firmadas para UPLOAD se siguen generando en el backend
 */
export async function getPublicUrl(s3Key: string): Promise<PresignedUrlResult> {
  try {
    if (!s3Key) {
      return {
        success: false,
        error: "s3Key no proporcionado",
      };
    }

    // Construir URL pública usando CloudFront (si está configurado) o S3 directo
    const cloudFrontUrl = import.meta.env.VITE_IMAGES_BASE_URL;
    const bucketName = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";

    let publicUrl: string;

    if (cloudFrontUrl) {
      // Usar CloudFront (recomendado)
      publicUrl = `${cloudFrontUrl}/${s3Key}`;
    } else {
      // Fallback a S3 directo (solo si CloudFront no está configurado)
      publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    }

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error inesperado:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Extrae el s3Key de una URL (o retorna el key si ya es un key)
 * Soporta URLs de: S3 directo, CloudFront, y legacy Supabase
 */
export function extractKeyFromUrl(urlOrKey: string): string | null {
  try {
    // Si ya es un s3Key (products/123.jpg), retornarlo
    if (urlOrKey.startsWith("products/")) {
      return urlOrKey;
    }

    // Si es una URL de S3 o CloudFront, extraer el key
    if (urlOrKey.includes("amazonaws.com") || urlOrKey.includes("cloudfront.net")) {
      const urlObj = new URL(urlOrKey);
      // URL: https://bucket.s3.region.amazonaws.com/products/123.jpg?signature...
      // URL: https://d1234.cloudfront.net/products/123.jpg
      const key = urlObj.pathname.substring(1).split("?")[0];
      return key;
    }

    // Fallback: intentar extraer de URL de Supabase (legacy)
    const urlObj = new URL(urlOrKey);
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  } catch {
    // Si falla el parsing de URL, asumir que es un key
    return urlOrKey.startsWith("products/") ? urlOrKey : null;
  }
}
