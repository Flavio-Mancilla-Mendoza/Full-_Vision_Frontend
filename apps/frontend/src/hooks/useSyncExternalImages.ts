import { useEffect, useRef } from "react";
import type { UploadingImage } from "@/types/image";
import type { DbProductImage } from "@/types";
import { sortImages } from "@/utils/imageHelpers";

interface UseSyncExternalImagesProps {
  existingImages: DbProductImage[];
  setImages: (images: UploadingImage[]) => void;
  onImagesChange: (images: DbProductImage[]) => void;
  images: UploadingImage[];
}

export function useSyncExternalImages({ existingImages, setImages, onImagesChange, images }: UseSyncExternalImagesProps) {
  const lastNotifiedImagesRef = useRef<string>("");
  const lastExistingImagesRef = useRef<string>("");
  const onImagesChangeRef = useRef(onImagesChange);
  const isUpdatingFromParentRef = useRef<boolean>(false);

  // Mantener la referencia actualizada de onImagesChange
  useEffect(() => {
    onImagesChangeRef.current = onImagesChange;
  }, [onImagesChange]);

  // Inicializar con imágenes existentes
  useEffect(() => {
    const newImagesKey = JSON.stringify(
      sortImages<DbProductImage>(existingImages).map((img) => ({ url: img.url, is_primary: img.is_primary, sort_order: img.sort_order }))
    );
    if (lastExistingImagesRef.current !== newImagesKey) {
      lastExistingImagesRef.current = newImagesKey;
      isUpdatingFromParentRef.current = true;
      setImages(existingImages.map((img) => ({ ...img })));
      setTimeout(() => {
        isUpdatingFromParentRef.current = false;
      }, 0);
    }
  }, [existingImages, setImages]);

  // Notificar cambios (solo imágenes completadas)
  useEffect(() => {
    const completedImages = images
      .filter((img) => !img.uploading)
      .map((img) => ({
        id: img.id || "",
        product_id: img.product_id || "",
        url: img.url,
        s3_key: img.s3_key,
        alt_text: img.alt_text || "",
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        created_at: img.created_at || new Date().toISOString(),
      }));
    const currentImagesKey = JSON.stringify(
      sortImages<(typeof completedImages)[0]>(completedImages).map((img) => ({
        url: img.url,
        s3_key: img.s3_key,
        is_primary: img.is_primary,
        sort_order: img.sort_order,
      }))
    );
    if (currentImagesKey !== lastNotifiedImagesRef.current) {
      if (isUpdatingFromParentRef.current) {
        lastNotifiedImagesRef.current = currentImagesKey;
        return;
      }
      lastNotifiedImagesRef.current = currentImagesKey;
      onImagesChangeRef.current(completedImages);
    }
  }, [images]);
}
