// Funciones utilitarias para manejo de imágenes
import type { UploadingImage } from "@/types/image";

// Generic sortImages to preserve all properties of the image type
export function sortImages<T extends { sort_order?: number }>(images: T[]): T[] {
  return [...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export function revokeBlobUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function updateAltText(images: UploadingImage[], index: number, alt_text: string): UploadingImage[] {
  return images.map((img, i) => (i === index ? { ...img, alt_text } : img));
}

export function cleanPendingFiles(images: UploadingImage[]): File[] {
  return images.filter((img) => img.file).map((img) => img.file!);
}
