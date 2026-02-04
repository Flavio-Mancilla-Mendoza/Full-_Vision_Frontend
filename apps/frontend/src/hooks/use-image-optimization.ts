import React from "react";

// CloudFront CDN URL desde variables de entorno
const CLOUDFRONT_URL = import.meta.env.VITE_IMAGES_BASE_URL || "";
const S3_BUCKET_NAME = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET || "";

// Hook personalizado para precargar imágenes críticas
export const useImagePreload = (src: string) => {
  React.useEffect(() => {
    const img = new Image();
    img.src = src;
  }, [src]);
};

// Extraer la key de S3 de una URL
const getS3KeyFromUrl = (url: string): string | null => {
  try {
    // Remover parámetros de query si existen
    const urlWithoutQuery = url.split("?")[0];

    // Patrón para URLs de S3: https://bucket.s3.region.amazonaws.com/key
    const s3Pattern = /https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/;
    const s3Match = urlWithoutQuery.match(s3Pattern);
    if (s3Match) return s3Match[1];

    // Patrón para CloudFront: https://cloudfront-url/key
    if (CLOUDFRONT_URL && urlWithoutQuery.startsWith(CLOUDFRONT_URL)) {
      return urlWithoutQuery.replace(CLOUDFRONT_URL + "/", "");
    }

    // Si ya es solo la key (sin dominio)
    if (!url.startsWith("http")) {
      return url;
    }

    return null;
  } catch (error) {
    console.error("Error parsing S3 URL:", error);
    return null;
  }
};

// Utility para generar URL optimizada
export const generateOptimizedUrl = (originalSrc: string, targetWidth?: number, targetQuality?: number) => {
  // Si no hay src válida, retornar placeholder
  if (!originalSrc || originalSrc.trim() === "") {
    return "/placeholder-glasses.jpg";
  }

  // Si es una URL externa (dicebear, etc.), retornar directamente
  if (originalSrc.includes("dicebear.com") || originalSrc.includes("placeholder")) {
    return originalSrc;
  }

  // Si es solo una clave de S3 (no contiene http), convertir a URL completa
  if (!originalSrc.startsWith("http") && !originalSrc.startsWith("//")) {
    // Es una clave de S3, construir URL completa
    const bucket = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
    const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";
    if (bucket) {
      originalSrc = `https://${bucket}.s3.${region}.amazonaws.com/${originalSrc}`;
    }
  }

  // Si es una URL de S3/CloudFront, usar CloudFront CDN
  const s3Key = getS3KeyFromUrl(originalSrc);
  if (s3Key && CLOUDFRONT_URL) {
    const baseUrl = `${CLOUDFRONT_URL}/${s3Key}`;

    // Preparar query params para transformaciones (Lambda@Edge)
    const params = new URLSearchParams();

    // Siempre convertir a WebP si no es ya WebP
    if (!s3Key.toLowerCase().endsWith(".webp")) {
      params.set("format", "webp");
    }

    if (targetWidth) {
      params.set("w", targetWidth.toString());
    }
    if (targetQuality && targetQuality < 100) {
      params.set("q", targetQuality.toString());
    }

    // Si hay parámetros, agregarlos a la URL
    if (params.toString()) {
      return `${baseUrl}?${params.toString()}`;
    }

    return baseUrl;
  }

  // Si es una URL de Supabase Storage (legacy)
  if (originalSrc.includes("supabase") && originalSrc.includes("storage")) {
    const params = new URLSearchParams();
    if (targetWidth) {
      params.set("width", targetWidth.toString());
    }
    if (targetQuality && targetQuality < 100) {
      params.set("quality", targetQuality.toString());
    }
    // Supabase Image Transformations (si está habilitado en tu plan)
    // return `${originalSrc}?${params.toString()}`;
  }

  return originalSrc;
};

// Generar srcSet para responsive
export const generateSrcSet = (originalSrc: string, width?: number, quality?: number) => {
  if (!width) return undefined;

  const sizes = [0.5, 1, 1.5, 2]; // 50%, 100%, 150%, 200%
  return sizes
    .map((scale) => {
      const scaledWidth = Math.round(width * scale);
      const optimizedSrc = generateOptimizedUrl(originalSrc, scaledWidth, quality);
      return `${optimizedSrc} ${scaledWidth}w`;
    })
    .join(", ");
};
