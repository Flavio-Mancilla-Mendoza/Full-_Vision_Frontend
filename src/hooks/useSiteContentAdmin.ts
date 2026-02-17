import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import {
  getAllSiteContent,
  updateSiteContent,
  uploadSiteImage,
  type SiteContent,
  type ContentUpdateData,
} from "@/services/siteContent";

/**
 * Hook de administración para gestionar contenido del sitio (CRUD + upload).
 * Separado de useSiteContent (solo lectura, público).
 */
export function useSiteContentAdmin() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSiteContent();
      setContent(data);
    } catch (error) {
      console.error("Error loading content:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido del sitio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleImageUpload = useCallback(
    async (contentId: string, file: File) => {
      try {
        setUploading(contentId);
        const imageUrl = await uploadSiteImage(file, "hero");
        await updateSiteContent(contentId, { value: imageUrl });
        await loadContent();
        toast({ title: "Éxito", description: "Imagen actualizada correctamente" });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
      } finally {
        setUploading(null);
      }
    },
    [loadContent],
  );

  const handleContentUpdate = useCallback(
    async (contentId: string, updates: ContentUpdateData) => {
      try {
        await updateSiteContent(contentId, updates);
        await loadContent();
        setEditing(null);
        toast({ title: "Éxito", description: "Contenido actualizado correctamente" });
      } catch (error) {
        console.error("Error updating content:", error);
        toast({ title: "Error", description: "No se pudo actualizar el contenido", variant: "destructive" });
      }
    },
    [loadContent],
  );

  const toggleActiveStatus = useCallback(
    async (contentId: string, isActive: boolean) => {
      try {
        await updateSiteContent(contentId, { is_active: isActive });
        await loadContent();
        toast({
          title: "Éxito",
          description: `Contenido ${isActive ? "activado" : "desactivado"} correctamente`,
        });
      } catch (error) {
        console.error("Error toggling content:", error);
        toast({ title: "Error", description: "No se pudo cambiar el estado del contenido", variant: "destructive" });
      }
    },
    [loadContent],
  );

  const getContentBySection = useCallback(
    (section: string) => content.filter((item) => item.section === section),
    [content],
  );

  return {
    content,
    loading,
    uploading,
    editing,
    setEditing,
    loadContent,
    handleImageUpload,
    handleContentUpdate,
    toggleActiveStatus,
    getContentBySection,
  };
}
