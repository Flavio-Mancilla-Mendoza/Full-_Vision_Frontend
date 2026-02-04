import React from "react";
import { ImageUploadCard } from "./ImageUploadCard";
import type { UploadingImage } from "@/types/image";

interface ImageUploadGridProps {
  images: UploadingImage[];
  setImages: (images: UploadingImage[]) => void;
  removeImage: (index: number) => void;
  setPrimaryImage: (index: number) => void;
}

export const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({ images, setImages, removeImage, setPrimaryImage }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {images.map((image, index) => (
      <ImageUploadCard
        key={index}
        image={image}
        index={index}
        setImages={setImages}
        images={images}
        removeImage={removeImage}
        setPrimaryImage={setPrimaryImage}
      />
    ))}
  </div>
);
