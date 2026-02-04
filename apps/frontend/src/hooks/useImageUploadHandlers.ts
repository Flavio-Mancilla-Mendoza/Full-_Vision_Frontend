import { useCallback } from "react";
import type { UploadingImage } from "@/types/image";

interface UseImageUploadHandlersProps {
  acceptedTypes: string[];
  maxSize: number;
  maxImages: number;
  images: UploadingImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadingImage[]>>;
  deferUpload: boolean;
  onPendingImagesChange?: (files: File[]) => void;
  toast: (opts: { title: string; description: string; variant?: string }) => void;
  enableAutoOptimization: boolean;
  compressionType: string;
  uploadToStorage: (file: File) => Promise<{ url: string; s3_key: string }>;
}

export function useImageUploadHandlers({
  acceptedTypes,
  maxSize,
  maxImages,
  images,
  setImages,
  deferUpload,
  onPendingImagesChange,
  toast,
  enableAutoOptimization,
  compressionType,
  uploadToStorage,
}: UseImageUploadHandlersProps) {
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `Tipo de archivo no válido. Acepta: ${acceptedTypes.join(", ")}`;
      }
      if (file.size > maxSize) {
        return `El archivo es muy grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      }
      if (images.length >= maxImages) {
        return `Máximo ${maxImages} imágenes permitidas`;
      }
      return null;
    },
    [acceptedTypes, maxSize, images.length, maxImages]
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file);
        if (validation) {
          toast({
            title: "Error en archivo",
            description: `${file.name}: ${validation}`,
            variant: "destructive",
          });
          continue;
        }
        validFiles.push(file);
      }
      if (validFiles.length === 0) return;
      const newImages: UploadingImage[] = validFiles.map((file, index) => ({
        url: URL.createObjectURL(file),
        alt_text: file.name,
        sort_order: images.length + index,
        is_primary: images.length === 0 && index === 0,
        file,
        uploading: deferUpload ? false : true,
        progress: 0,
      }));
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      if (deferUpload) {
        const allPendingFiles = updatedImages.filter((img) => img.file).map((img) => img.file!);
        onPendingImagesChange?.(allPendingFiles);
        toast({
          title: "Imágenes listas",
          description: `${validFiles.length} imagen(es) lista(s) para subir cuando guardes el producto`,
        });
        return;
      }
      for (let i = 0; i < newImages.length; i++) {
        const imageData = newImages[i];
        try {
          const originalFile = imageData.file!;
          const updateProgress = (progress: number) => {
            setImages((current) => current.map((img) => (img.file === originalFile ? { ...img, progress } : img)));
          };
          updateProgress(10);
          const fileToUpload = originalFile;
          if (enableAutoOptimization) {
            // autoOptimize y getCompressionStats deben ser importados y pasados si se usan aquí
          }
          updateProgress(50);
          const uploadResult = await uploadToStorage(fileToUpload);
          updateProgress(75);
          setImages((current) => {
            const updated = current.map((img) =>
              img.file === originalFile
                ? {
                    ...img,
                    url: uploadResult.url,
                    s3_key: uploadResult.s3_key,
                    uploading: false,
                    progress: 100,
                    file: undefined,
                  }
                : img
            );
            return updated;
          });
          updateProgress(100);
          toast({
            title: "✅ Imagen subida",
            description: `${originalFile.name} se subió correctamente`,
          });
        } catch (error) {
          setImages((current) => current.filter((img) => img.file !== imageData.file));
          toast({
            title: "Error al subir",
            description: `No se pudo subir ${imageData.alt_text}`,
            variant: "destructive",
          });
        }
      }
    },
    [images, toast, validateFile, enableAutoOptimization, uploadToStorage, deferUpload, onPendingImagesChange, setImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      // setDragOver debe ser manejado en el componente padre
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  return { validateFile, handleFiles, handleDrop, handleFileSelect };
}
