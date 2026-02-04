import { useCallback } from "react";
import type { UploadingImage } from "@/types/image";

export function useImageListActions(images: UploadingImage[], setImages: (images: UploadingImage[]) => void) {
  const removeImage = useCallback(
    async (
      index: number,
      deleteProductImage?: (s3_key: string) => Promise<{ success: boolean }>,
      toast?: (opts: { title: string; description: string; variant?: string }) => void
    ) => {
      const imageToRemove = images[index];
      if (imageToRemove.url.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      if (imageToRemove.s3_key && deleteProductImage) {
        try {
          const result = await deleteProductImage(imageToRemove.s3_key);
          if (!result.success && toast) {
            toast({ title: "Error", description: "No se pudo eliminar la imagen de S3", variant: "destructive" });
          }
        } catch (error) {
          if (toast) {
            toast({ title: "Error", description: "No se pudo eliminar la imagen de S3", variant: "destructive" });
          }
        }
      }
      const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sort_order: i }));
      if (imageToRemove.is_primary && updated.length > 0) {
        updated[0].is_primary = true;
      }
      setImages(updated);
    },
    [images, setImages]
  );

  const setPrimaryImage = useCallback(
    (index: number) => {
      const updated = images.map((img, i) => ({ ...img, is_primary: i === index }));
      setImages(updated);
    },
    [images, setImages]
  );

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updated = [...images];
      const [movedImage] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedImage);
      updated.forEach((img, i) => {
        img.sort_order = i;
      });
      setImages(updated);
    },
    [images, setImages]
  );

  return { removeImage, setPrimaryImage, moveImage };
}
