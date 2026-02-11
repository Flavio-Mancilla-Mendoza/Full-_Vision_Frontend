/**
 * ImageGallery - Galería de imágenes del producto con flechas y thumbnails
 */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/ui/optimized-image";
import type { ProductImageItem } from "@/lib/product-utils";

interface ImageGalleryProps {
  images: ProductImageItem[];
  productName: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = images[selectedIndex];

  const goToPrev = () =>
    setSelectedIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const goToNext = () =>
    setSelectedIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="relative bg-white rounded-lg overflow-hidden aspect-square flex items-center justify-center border">
        <ProductImage
          src={currentImage.url || "/placeholder-glasses.jpg"}
          alt={currentImage.alt_text || productName}
          width={600}
          height={600}
          className="w-full h-full object-contain p-8"
          priority={true}
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={90}
        />

        {/* Flechas de navegación */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(index)}
              className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                index === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <img
                src={img.url || "/placeholder-glasses.jpg"}
                alt={img.alt_text || `Vista ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
