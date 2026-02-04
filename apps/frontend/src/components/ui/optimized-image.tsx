import React, { useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { generateOptimizedUrl, generateSrcSet } from "@/hooks/use-image-optimization";

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

  // Hook para detectar cuando la imagen entra en el viewport
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: priority, // Si es priority, no usar lazy loading
    rootMargin: "50px", // Cargar un poco antes de que sea visible
  });

  // Combinar refs
  const setRefs = useCallback(
    (element: HTMLImageElement | null) => {
      imgRef.current = element;
      inViewRef(element);
    },
    [inViewRef]
  );

  // Generar URL optimizada una vez
  const optimizedSrc = React.useMemo(() => {
    return generateOptimizedUrl(src, width, quality);
  }, [src, width, quality]);

  // Determinar si debemos mostrar la imagen
  const shouldLoadImage = priority || inView;

  // Manejar carga de imagen con callback optimizado
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Manejar error de imagen con callback optimizado
  const handleError = useCallback(() => {
    setIsError(true);
    onError?.();
  }, [onError]);

  // Placeholder optimizado
  const renderPlaceholder = () => {
    if (placeholder === "empty") return null;

    return (
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200",
          "flex items-center justify-center",
          isLoaded ? "opacity-0" : "opacity-100",
          "transition-opacity duration-300",
          className
        )}
        style={{ width, height }}
      >
        <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
      </div>
    );
  };

  // Error state optimizado
  const renderError = () => (
    <div
      className={cn("bg-gray-50 border border-gray-200 rounded-lg", "flex items-center justify-center text-gray-400 text-sm", className)}
      style={{ width, height }}
    >
      <div className="text-center p-4">
        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs">Error al cargar</p>
      </div>
    </div>
  );

  if (isError) {
    return renderError();
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {/* Placeholder */}
      {renderPlaceholder()}

      {/* Imagen principal */}
      {shouldLoadImage && (
        <img
          ref={setRefs}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={generateSrcSet(optimizedSrc, width, quality)}
          className={cn("transition-opacity duration-500 ease-out", isLoaded ? "opacity-100" : "opacity-0", className)}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
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
      className={cn("object-cover transition-transform duration-300 hover:scale-105", isHero && "object-center", className)}
      placeholder="blur"
      quality={isHero ? 90 : 80}
    />
  );
};

export default OptimizedImage;
