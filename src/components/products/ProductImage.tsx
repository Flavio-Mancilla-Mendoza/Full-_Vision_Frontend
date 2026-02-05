import React, { useState } from "react";

interface PlaceholderImageProps {
  className?: string;
  alt?: string;
  productName?: string;
  brand?: string;
}

export const PlaceholderSunglasses: React.FC<PlaceholderImageProps> = ({
  className = "",
  alt = "Placeholder sunglasses",
  productName = "Lentes",
  brand = "Brand",
}) => {
  return (
    <div className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}>
      <div className="text-center p-4">
        {/* Ícono de lentes simple con CSS */}
        <div className="mx-auto mb-2 w-16 h-8 relative">
          {/* Marco izquierdo */}
          <div className="absolute left-0 top-1 w-6 h-6 border-2 border-slate-400 rounded-full"></div>
          {/* Marco derecho */}
          <div className="absolute right-0 top-1 w-6 h-6 border-2 border-slate-400 rounded-full"></div>
          {/* Puente */}
          <div className="absolute left-6 top-3 w-4 h-1 bg-slate-400 rounded"></div>
          {/* Patillas */}
          <div className="absolute -left-1 top-3 w-2 h-1 bg-slate-400 rounded"></div>
          <div className="absolute -right-1 top-3 w-2 h-1 bg-slate-400 rounded"></div>
        </div>

        <div className="text-xs text-slate-500 font-medium">{brand}</div>
        <div className="text-xs text-slate-400 truncate max-w-24">{productName}</div>
      </div>
    </div>
  );
};

// Skeleton loader para mientras carga la imagen
const ImageSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4 opacity-30">
          {/* Ícono de lentes en skeleton */}
          <div className="mx-auto mb-2 w-16 h-8 relative">
            <div className="absolute left-0 top-1 w-6 h-6 border-2 border-slate-300 rounded-full"></div>
            <div className="absolute right-0 top-1 w-6 h-6 border-2 border-slate-300 rounded-full"></div>
            <div className="absolute left-6 top-3 w-4 h-1 bg-slate-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente wrapper para LazyImage con placeholder
interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  productName?: string;
  brand?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = "",
  productName,
  brand,
  loading = "lazy",
  priority = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!src || src === "/placeholder-product.jpg") {
    return <PlaceholderSunglasses className={className} alt={alt} productName={productName} brand={brand} />;
  }

  if (imageError) {
    return <PlaceholderSunglasses className={className} alt={alt} productName={productName} brand={brand} />;
  }

  return (
    <div className="relative w-full h-full">
      {/* Skeleton mientras carga */}
      {!imageLoaded && <ImageSkeleton className={className} />}

      {/* Imagen real */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
        loading={loading}
        {...{ fetchpriority: priority ? "high" : "auto" }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};
