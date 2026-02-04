import React from "react";
import { generateImageSizes, type CompressionType } from "./image-compression";
import { supabase } from "@/lib/supabase";

// Configuraciones de tamaños por tipo de imagen
export const imageSizeConfigs = {
  product: [
    { name: "thumbnail", width: 150, height: 150, quality: 0.7 },
    { name: "small", width: 300, height: 300, quality: 0.8 },
    { name: "medium", width: 600, height: 600, quality: 0.8 },
    { name: "large", width: 1200, height: 1200, quality: 0.85 },
  ],
  hero: [
    { name: "mobile", width: 768, height: 500, quality: 0.85 },
    { name: "tablet", width: 1024, height: 600, quality: 0.85 },
    { name: "desktop", width: 1920, height: 750, quality: 0.9 },
    { name: "retina", width: 3840, height: 1500, quality: 0.9 },
  ],
  gallery: [
    { name: "thumbnail", width: 200, height: 200, quality: 0.7 },
    { name: "preview", width: 400, height: 400, quality: 0.8 },
    { name: "full", width: 1000, height: 1000, quality: 0.85 },
  ],
} as const;

export type ImageType = keyof typeof imageSizeConfigs;

export type ImageSizeType = keyof typeof imageSizeConfigs;

// Interfaz para metadatos de imagen
export interface ImageMetadata {
  originalUrl: string;
  sizes: { [key: string]: string }; // { thumbnail: 'url1', small: 'url2', etc. }
  originalSize: number;
  optimizedSizes: { [key: string]: number };
  totalSavings: number;
  compressionStats: {
    originalSizeMB: string;
    totalOptimizedSizeMB: string;
    savingsPercent: string;
  };
}

// Subir archivo a Supabase Storage
const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  const { data, error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Generar nombre único para archivo
const generateUniqueFileName = (originalName: string, sizeName?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = originalName.split(".").pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

  if (sizeName) {
    return `${nameWithoutExt}-${sizeName}-${timestamp}-${random}.${ext}`;
  }

  return `${nameWithoutExt}-${timestamp}-${random}.${ext}`;
};

// Función principal: subir imagen con múltiples tamaños
export const uploadImageWithSizes = async (
  file: File,
  sizeType: ImageSizeType = "product",
  onProgress?: (progress: number, status: string) => void
): Promise<ImageMetadata> => {
  try {
    onProgress?.(10, "Iniciando proceso...");

    // 1. Generar múltiples tamaños
    onProgress?.(20, "Generando tamaños...");
    const sizeConfig = [...(imageSizeConfigs[sizeType] || imageSizeConfigs.product)];
    const generatedSizes = await generateImageSizes(file, sizeConfig);

    onProgress?.(50, "Subiendo imágenes...");

    // 2. Subir archivo original
    const originalPath = `originals/${generateUniqueFileName(file.name)}`;
    const originalUrl = await uploadFileToStorage(file, originalPath);

    // 3. Subir todos los tamaños generados
    const sizeUrls: { [key: string]: string } = {};
    const optimizedSizes: { [key: string]: number } = {};
    let totalOptimizedSize = 0;

    for (let i = 0; i < sizeConfig.length; i++) {
      const config = sizeConfig[i];
      const sizedFile = generatedSizes[config.name];

      if (sizedFile) {
        const sizePath = `${config.name}/${generateUniqueFileName(file.name, config.name)}`;
        const sizeUrl = await uploadFileToStorage(sizedFile, sizePath);

        sizeUrls[config.name] = sizeUrl;
        optimizedSizes[config.name] = sizedFile.size;
        totalOptimizedSize += sizedFile.size;

        onProgress?.(50 + ((i + 1) / sizeConfig.length) * 40, `Subiendo ${config.name}...`);
      }
    }

    onProgress?.(95, "Finalizando...");

    // 4. Calcular estadísticas
    const totalSavings = file.size - totalOptimizedSize;
    const savingsPercent = ((totalSavings / file.size) * 100).toFixed(1);

    const metadata: ImageMetadata = {
      originalUrl,
      sizes: sizeUrls,
      originalSize: file.size,
      optimizedSizes,
      totalSavings,
      compressionStats: {
        originalSizeMB: (file.size / 1024 / 1024).toFixed(2),
        totalOptimizedSizeMB: (totalOptimizedSize / 1024 / 1024).toFixed(2),
        savingsPercent,
      },
    };

    onProgress?.(100, "Completado");

    console.log("📊 Estadísticas de optimización:", metadata.compressionStats);

    return metadata;
  } catch (error) {
    console.error("Error en uploadImageWithSizes:", error);
    throw error;
  }
};

// Hook React para subir imágenes con tamaños
export const useImageUploadWithSizes = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState("");

  const uploadImage = async (file: File, sizeType: ImageSizeType = "product"): Promise<ImageMetadata> => {
    setIsUploading(true);
    setProgress(0);
    setStatus("Iniciando...");

    try {
      const result = await uploadImageWithSizes(file, sizeType, (progress, status) => {
        setProgress(progress);
        setStatus(status);
      });

      setStatus("Completado ✅");
      return result;
    } catch (error) {
      setStatus("Error ❌");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    progress,
    status,
  };
};

// Función utilitaria para obtener la mejor URL según el tamaño solicitado
export const getBestImageUrl = (metadata: ImageMetadata, requestedWidth: number): string => {
  const { sizes } = metadata;

  // Determinar el mejor tamaño según el ancho solicitado
  if (requestedWidth <= 200 && sizes.thumbnail) return sizes.thumbnail;
  if (requestedWidth <= 400 && sizes.small) return sizes.small;
  if (requestedWidth <= 800 && sizes.medium) return sizes.medium;
  if (sizes.large) return sizes.large;

  // Fallback al original
  return metadata.originalUrl;
};

// Generar srcSet para responsive images
export const generateResponsiveSrcSet = (metadata: ImageMetadata): string => {
  const { sizes } = metadata;
  const srcSetEntries: string[] = [];

  // Mapear tamaños a anchos típicos
  const sizeWidthMap = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
    mobile: 768,
    tablet: 1024,
    desktop: 1920,
    preview: 400,
    full: 1000,
  };

  Object.entries(sizes).forEach(([sizeName, url]) => {
    const width = sizeWidthMap[sizeName as keyof typeof sizeWidthMap];
    if (width) {
      srcSetEntries.push(`${url} ${width}w`);
    }
  });

  return srcSetEntries.join(", ");
};
