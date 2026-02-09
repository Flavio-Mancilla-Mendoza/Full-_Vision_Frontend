import React, { useState, useRef, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { ImageUploadDropzone } from "./image-upload/ImageUploadDropzone";
import { ImageUploadGrid } from "./image-upload/ImageUploadGrid";
import { useToast } from "@/components/ui/use-toast";
import { uploadProductImage, deleteProductImage, extractKeyFromUrl } from "@/services/imageStorage";

import { useImageUploadHandlers } from "@/hooks/useImageUploadHandlers";
import { useImageListActions } from "@/hooks/useImageListActions";
import { useSyncExternalImages } from "@/hooks/useSyncExternalImages";

import type { UploadingImage, ImageUploadProps } from "@/types/image";
import { DEFAULT_MAX_IMAGES, DEFAULT_MAX_SIZE, DEFAULT_ACCEPTED_TYPES } from "@/config/upload";

export const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  existingImages = [],
  onImagesChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  compressionType = "product",
  enableAutoOptimization = true,
  imageType = "product",
  enableMultiSize = true,
  deferUpload = false,
  onPendingImagesChange,
}) => {
  const [images, setImages] = useState<UploadingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sincronización y notificación modularizada
  useSyncExternalImages({
    existingImages,
    setImages,
    onImagesChange,
    images,
  });

  const uploadToStorage = useCallback(async (file: File): Promise<{ url: string; s3_key: string }> => {
    // Upload to S3 via Lambda
    const result = await uploadProductImage(file, "products");

    if (!result.success || !result.s3Key) {
      throw new Error(result.error || "Error al subir imagen");
    }

    return {
      url: result.url || result.s3Key, // URL o key temporalmente
      s3_key: result.s3Key,
    };
  }, []);

  // Adaptar toast para que acepte solo los variants válidos
  const toastAdapter = (opts: { title: string; description: string; variant?: "default" | "destructive" }) => {
    toast({ ...opts, variant: opts.variant });
  };

  const { validateFile, handleFiles, handleDrop, handleFileSelect } = useImageUploadHandlers({
    acceptedTypes,
    maxSize,
    maxImages,
    images,
    setImages,
    deferUpload,
    onPendingImagesChange,
    toast: toastAdapter,
    enableAutoOptimization,
    compressionType,
    uploadToStorage,
  });

  // Acciones sobre la lista de imágenes modularizadas
  const { removeImage, setPrimaryImage, moveImage } = useImageListActions(images, setImages);

  return (
    <div className="space-y-4">
      <Label>Imágenes del Producto</Label>

      <ImageUploadDropzone
        dragOver={dragOver}
        maxImages={maxImages}
        maxSize={maxSize}
        acceptedTypes={acceptedTypes}
        handleFileSelect={handleFileSelect}
        handleDrop={handleDrop}
        setDragOver={setDragOver}
      />

      {images.length > 0 && (
        <ImageUploadGrid images={images} setImages={setImages} removeImage={removeImage} setPrimaryImage={setPrimaryImage} />
      )}

      {images.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {images.length} de {maxImages} imágenes
          {images.filter((img) => img.is_primary).length > 0 && <span className="ml-2">• Imagen principal seleccionada</span>}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
