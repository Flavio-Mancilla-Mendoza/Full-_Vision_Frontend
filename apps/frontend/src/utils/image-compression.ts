import imageCompression from "browser-image-compression";

// Configuraciones de compresión por tipo de imagen
export const compressionConfigs = {
  thumbnail: {
    maxSizeMB: 0.1, // 100KB máximo
    maxWidthOrHeight: 300,
    useWebWorker: true,
    quality: 0.7,
  },
  product: {
    maxSizeMB: 0.3, // 300KB máximo
    maxWidthOrHeight: 800,
    useWebWorker: true,
    quality: 0.8,
  },
  hero: {
    maxSizeMB: 0.8, // 800KB máximo
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    quality: 0.85,
  },
  gallery: {
    maxSizeMB: 0.5, // 500KB máximo
    maxWidthOrHeight: 1000,
    useWebWorker: true,
    quality: 0.8,
  },
} as const;

export type CompressionType = keyof typeof compressionConfigs;

// Función principal de compresión
export const compressImage = async (file: File, type: CompressionType = "product"): Promise<File> => {
  try {
    const config = compressionConfigs[type];

    // Si el archivo ya es pequeño, no comprimir
    if (file.size <= config.maxSizeMB * 1024 * 1024) {
      console.log(`Archivo ${file.name} ya está optimizado (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return file;
    }

    console.log(`Comprimiendo ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) con configuración ${type}...`);

    const compressedFile = await imageCompression(file, config);

    console.log(
      `✅ Compresión completada: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${(
        (1 - compressedFile.size / file.size) *
        100
      ).toFixed(1)}% reducción)`
    );

    return compressedFile;
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    throw new Error(`Error al comprimir imagen: ${error}`);
  }
};

// Comprimir múltiples imágenes en paralelo
export const compressImages = async (
  files: File[],
  type: CompressionType = "product",
  onProgress?: (progress: number, fileName: string) => void
): Promise<File[]> => {
  const compressedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      onProgress?.(Math.round((i / files.length) * 100), file.name);
      const compressed = await compressImage(file, type);
      compressedFiles.push(compressed);
    } catch (error) {
      console.error(`Error comprimiendo ${file.name}:`, error);
      // En caso de error, usar archivo original
      compressedFiles.push(file);
    }
  }

  onProgress?.(100, "Completado");
  return compressedFiles;
};

// Redimensionar imagen manteniendo aspect ratio
export const resizeImage = async (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> => {
  try {
    const config = {
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      quality,
    };

    return await imageCompression(file, config);
  } catch (error) {
    console.error("Error redimensionando imagen:", error);
    throw new Error(`Error al redimensionar imagen: ${error}`);
  }
};

// Generar múltiples tamaños de una imagen
export const generateImageSizes = async (
  file: File,
  sizes: { name: string; width: number; height: number; quality?: number }[]
): Promise<{ [key: string]: File }> => {
  const results: { [key: string]: File } = {};

  for (const size of sizes) {
    try {
      const resized = await resizeImage(file, size.width, size.height, size.quality || 0.8);
      results[size.name] = resized;
    } catch (error) {
      console.error(`Error generando tamaño ${size.name}:`, error);
      results[size.name] = file; // Fallback al archivo original
    }
  }

  return results;
};

// Convertir a WebP si es soportado
export const convertToWebP = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
            });
            resolve(webpFile);
          } else {
            reject(new Error("Error converting to WebP"));
          }
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = () => reject(new Error("Error loading image"));
    img.src = URL.createObjectURL(file);
  });
};

// Detectar soporte para WebP
export const supportsWebP = (): boolean => {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
};

// Optimizador automático que elige la mejor estrategia
export const autoOptimize = async (file: File, type: CompressionType = "product"): Promise<File> => {
  try {
    // 1. Comprimir primero
    let optimized = await compressImage(file, type);

    // 2. Convertir a WebP si es soportado y beneficioso
    if (supportsWebP() && file.type !== "image/webp") {
      try {
        const webpVersion = await convertToWebP(optimized);
        // Solo usar WebP si es significativamente más pequeño
        if (webpVersion.size < optimized.size * 0.9) {
          optimized = webpVersion;
          console.log(`✅ Convertido a WebP: ${((1 - webpVersion.size / optimized.size) * 100).toFixed(1)}% adicional de reducción`);
        }
      } catch (error) {
        console.warn("No se pudo convertir a WebP, usando imagen comprimida:", error);
      }
    }

    return optimized;
  } catch (error) {
    console.error("Error en optimización automática:", error);
    return file; // Fallback al archivo original
  }
};

// Estadísticas de compresión
export const getCompressionStats = (originalFile: File, compressedFile: File) => {
  const originalSize = originalFile.size;
  const compressedSize = compressedFile.size;
  const reduction = ((originalSize - compressedSize) / originalSize) * 100;

  return {
    originalSize: originalSize,
    compressedSize: compressedSize,
    reduction: reduction,
    originalSizeMB: (originalSize / 1024 / 1024).toFixed(2),
    compressedSizeMB: (compressedSize / 1024 / 1024).toFixed(2),
    reductionPercent: reduction.toFixed(1),
  };
};
