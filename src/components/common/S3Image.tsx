// Component to display images from Supabase Storage
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface S3ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  s3Key?: string | null; // Storage key (e.g., "products/image-123.jpg")
  url?: string | null; // Direct URL (for legacy images)
  fallback?: string; // Default image URL if loading fails
}

export function S3Image({ s3Key, url: directUrl, fallback, className, alt, ...props }: S3ImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log("🖼️ S3Image - s3Key:", s3Key, "directUrl:", directUrl);

    // Si hay URL directa, usarla inmediatamente
    if (directUrl) {
      console.log("✅ S3Image - Usando URL directa");
      setUrl(directUrl);
      setError(false);
      setLoading(false);
      return;
    }

    // Si no hay s3Key ni URL directa, error
    if (!s3Key) {
      console.log("❌ S3Image - No hay s3Key ni URL directa");
      setLoading(false);
      setError(true);
      return;
    }

    // Obtener URL desde Supabase Storage usando s3Key
    try {
      const { data } = supabase.storage.from("product-images").getPublicUrl(s3Key);
      console.log("✅ S3Image - URL generada desde s3Key:", data.publicUrl);
      setUrl(data.publicUrl);
      setError(false);
    } catch (err) {
      console.error("❌ S3Image - Error getting image URL:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [s3Key, directUrl]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !url) {
    if (fallback) {
      return <img src={fallback} alt={alt || "Image"} className={className} {...props} />;
    }

    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <span className="text-sm text-muted-foreground">Error cargando imagen</span>
      </div>
    );
  }

  return <img src={url} alt={alt || "S3 Image"} className={className} {...props} />;
}
