import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { generateOptimizedUrl } from "@/hooks/use-image-optimization";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // Para imágenes above-the-fold
  sizes?: string; // Para responsive
  quality?: number; // Calidad de compresión (1-100)
  placeholder?: "blur" | "empty";
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = "100vw",
  quality = 80,
  placeholder = "blur",
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generar URL optimizada
  const optimizedSrc = React.useMemo(() => {
    return generateOptimizedUrl(src, width, quality);
  }, [src, width, quality]);

  // Manejar carga de imagen
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Manejar error: intentar sin query params, luego mostrar placeholder
  const handleError = useCallback(() => {
    const img = imgRef.current;
    if (img && !img.dataset.retried) {
      img.dataset.retried = "true";
      const fallbackUrl = optimizedSrc.split("?")[0];
      if (fallbackUrl !== optimizedSrc) {
        img.src = fallbackUrl;
        return;
      }
    }
    setIsError(true);
    onError?.();
  }, [onError, optimizedSrc]);

  // Error state
  if (isError) {
    return (
      <div
        className={cn("relative overflow-hidden bg-gray-100 flex items-center justify-center", className)}
        style={{ width, height }}
      >
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
          </svg>
          <p className="text-xs">Sin imagen</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Placeholder spinner - se oculta cuando la imagen carga */}
      {placeholder === "blur" && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center transition-opacity duration-300">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Imagen - siempre en el DOM, el browser maneja lazy loading nativo */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn("w-full h-full transition-opacity duration-500 ease-out", isLoaded ? "opacity-100" : "opacity-0")}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
};

// Componente específico para imágenes de productos
export const ProductImage: React.FC<OptimizedImageProps & { isHero?: boolean }> = ({
  isHero = false,
  className,
  src,
  alt,
  priority,
  ...props
}) => {
  // Si no hay src válida, mostrar placeholder
  if (!src || src.trim() === "") {
    return (
      <div className={cn("bg-gray-200 flex items-center justify-center text-gray-400 text-sm", className)}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded"></div>
          Sin imagen
        </div>
      </div>
    );
  }

  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      priority={priority || isHero}
      className={cn(isHero && "object-center", className)}
      placeholder="blur"
      quality={isHero ? 90 : 80}
    />
  );
};

export default OptimizedImage;
