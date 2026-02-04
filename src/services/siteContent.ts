// src/services/siteContent.ts
import { supabase } from "@/lib/supabase";
import api from "@/services/api";
import { DbSiteContent, Json } from "@/types";

// Exportar el tipo directamente desde Supabase
export type SiteContent = DbSiteContent;

export interface SiteContentMetadata {
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  font_size?: string;
  color?: string;
  [key: string]: unknown;
}

export interface ContentUpdateData {
  value?: string;
  alt_text?: string;
  metadata?: Json;
  is_active?: boolean;
  sort_order?: number;
}

// ==================== OBTENER CONTENIDO ====================

// Obtener contenido por sección (público - sin autenticación)
export async function getSiteContentBySection(section: string): Promise<SiteContent[]> {
  try {
    const response = await fetch(`${api.getApiUrl()}/public/site-content/${section}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as SiteContent[];
  } catch (error) {
    console.error("Error fetching site content from API:", error);
    return [];
  }
}

// Obtener contenido específico por clave (público)
export async function getSiteContentByKey(section: string, key: string): Promise<SiteContent | null> {
  try {
    const response = await fetch(`${api.getApiUrl()}/public/site-content/${section}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as SiteContent[];
    const content = data.find((item) => item.key === key);
    return content || null;
  } catch (error) {
    console.error("Error fetching site content by key from API:", error);
    return null;
  }
}

// Obtener todo el contenido del sitio (público)
export async function getAllSiteContent(): Promise<SiteContent[]> {
  try {
    const response = await fetch(`${api.getApiUrl()}/public/site-content`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as SiteContent[];
  } catch (error) {
    console.error("Error fetching all site content from API:", error);
    return [];
  }
}

// ==================== GESTIÓN ADMIN ====================

// Crear nuevo contenido
export async function createSiteContent(content: Omit<SiteContent, "id" | "created_at" | "updated_at">): Promise<SiteContent> {
  const { data, error } = await supabase.from("site_content").insert([content]).select().single();

  if (error) throw error;
  return data;
}

// Actualizar contenido existente
export async function updateSiteContent(id: string, updates: ContentUpdateData): Promise<SiteContent> {
  const { data, error } = await supabase
    .from("site_content")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar contenido
export async function deleteSiteContent(id: string): Promise<void> {
  const { error } = await supabase.from("site_content").delete().eq("id", id);

  if (error) throw error;
}

// ==================== UPLOAD DE IMÁGENES ====================

export async function uploadSiteImage(file: File, folder: string = "general"): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { data, error } = await supabase.storage.from("site-content").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("site-content").getPublicUrl(data.path);

  return publicUrl;
}

// Eliminar imagen del storage
export async function deleteSiteImage(imagePath: string): Promise<void> {
  const path = imagePath.split("/site-content/")[1];
  if (!path) return;

  const { error } = await supabase.storage.from("site-content").remove([path]);

  if (error) throw error;
}
