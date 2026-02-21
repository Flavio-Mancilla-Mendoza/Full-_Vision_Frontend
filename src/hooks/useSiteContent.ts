// src/hooks/useSiteContent.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { getSiteContentBySection, getAllSiteContent, type SiteContent } from "@/services/siteContent";

export type { SiteContent } from "@/services/siteContent";

// ── Cache global de contenido por sección ──
const _contentCache = new Map<string, SiteContent[]>();
const _contentLoadPromises = new Map<string, Promise<SiteContent[]>>();

export function useSiteContent(section?: string) {
  const cacheKey = section || "__all__";
  const [content, setContent] = useState<SiteContent[]>(() => _contentCache.get(cacheKey) || []);
  const [loading, setLoading] = useState(!_contentCache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si ya está en cache, usar datos cacheados
    if (_contentCache.has(cacheKey)) {
      setContent(_contentCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);

        // Deduplicar llamadas concurrentes
        let promise = _contentLoadPromises.get(cacheKey);
        if (!promise) {
          promise = section && section.trim() !== ""
            ? getSiteContentBySection(section)
            : getAllSiteContent();
          _contentLoadPromises.set(cacheKey, promise);
        }

        const data = await promise;
        _contentCache.set(cacheKey, data);
        _contentLoadPromises.delete(cacheKey);
        setContent(data);
      } catch (err) {
        _contentLoadPromises.delete(cacheKey);
        console.error("Error fetching site content:", err);
        setError(err instanceof Error ? err.message : "Error al cargar contenido del sitio");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [section, cacheKey]);

  const getContentByKey = useCallback((key: string, fallback?: string): string => {
    const item = content.find((c) => c.key === key);
    return item?.value || fallback || "";
  }, [content]);

  const getContentMetadata = useCallback((key: string) => {
    const item = content.find((c) => c.key === key);
    return item?.metadata || {};
  }, [content]);

  const getAltText = useCallback((key: string, fallback?: string): string => {
    const item = content.find((c) => c.key === key);
    return item?.alt_text || fallback || "";
  }, [content]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    _contentCache.delete(cacheKey);
    try {
      const data = section && section.trim() !== ""
        ? await getSiteContentBySection(section)
        : await getAllSiteContent();
      _contentCache.set(cacheKey, data);
      setContent(data);
    } catch (err) {
      console.error("Error refetching site content:", err);
      setError(err instanceof Error ? err.message : "Error al recargar contenido del sitio");
    } finally {
      setLoading(false);
    }
  }, [section, cacheKey]);

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

  // Derivar imageKey de content directamente (estable)
  const imageKey = useMemo(() => {
    const item = content.find((c) => c.key === "hero_background");
    return item?.value || "";
  }, [content]);

  useEffect(() => {
    if (!imageKey || imageKey.trim() === "") {
      setOptimizedImageUrl(null);
      return;
    }

    if (imageKey.startsWith("http")) {
      setOptimizedImageUrl(imageKey);
    } else {
      // Si es solo el path, construir URL pública
      import("@/lib/supabase").then(({ supabase }) => {
        const { data } = supabase.storage.from("site-content").getPublicUrl(imageKey);
        if (data) {
          setOptimizedImageUrl(data.publicURL);
        }
      });
    }
  }, [imageKey]);

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
