// src/hooks/useSiteContent.ts
import { useState, useEffect } from "react";
import { getSiteContentBySection, getAllSiteContent, type SiteContent } from "@/services/siteContent";

export type { SiteContent } from "@/services/siteContent";

export function useSiteContent(section?: string) {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);
        let data: SiteContent[];

        if (section && section.trim() !== "") {
          // Obtener contenido por sección específica
          data = await getSiteContentBySection(section);
        } else {
          // Si no hay sección, obtener todo el contenido
          data = await getAllSiteContent();
        }

        setContent(data);
      } catch (err) {
        console.error("Error fetching site content:", err);
        setError(err instanceof Error ? err.message : "Error al cargar contenido del sitio");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [section]);

  const getContentByKey = (key: string, fallback?: string): string => {
    const item = content.find((c) => c.key === key);
    return item?.value || fallback || "";
  };

  const getContentMetadata = (key: string) => {
    const item = content.find((c) => c.key === key);
    return item?.metadata || {};
  };

  const getAltText = (key: string, fallback?: string): string => {
    const item = content.find((c) => c.key === key);
    return item?.alt_text || fallback || "";
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: SiteContent[];

      if (section && section.trim() !== "") {
        data = await getSiteContentBySection(section);
      } else {
        data = await getAllSiteContent();
      }

      setContent(data);
    } catch (err) {
      console.error("Error refetching site content:", err);
      setError(err instanceof Error ? err.message : "Error al recargar contenido del sitio");
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    loading,
    error,
    getContentByKey,
    getContentMetadata,
    getAltText,
    refetch,
  };
}

// Hook específico para el contenido del Hero con optimización de imágenes
export function useHeroContent() {
  const { content, loading, error, getContentByKey, getAltText, refetch } = useSiteContent("hero");
  const [optimizedImageUrl, setOptimizedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const imageKey = getContentByKey("hero_background");
    if (imageKey && imageKey.trim() !== "") {
      // Si la URL ya está completa (publicUrl), usarla directamente
      if (imageKey.startsWith("http")) {
        setOptimizedImageUrl(imageKey);
      } else {
        // Si es solo el path, construir URL optimizada con transformaciones
        import("@/lib/supabase").then(({ supabase }) => {
          const optimizedUrl = supabase.storage.from("site-content").getPublicUrl(imageKey, {
            transform: {
              width: 1920,
              height: 650,
              resize: "cover",
              quality: 85,
            },
          }).data.publicUrl;

          setOptimizedImageUrl(optimizedUrl);
        });
      }
    } else {
      setOptimizedImageUrl(null);
    }
  }, [getContentByKey]);

  return {
    loading,
    error,
    heroImage: optimizedImageUrl,
    heroTitle: getContentByKey("hero_title"),
    heroSubtitle: getContentByKey("hero_subtitle"),
    heroImageAlt: getAltText("hero_background"),
    refetch,
  };
}
