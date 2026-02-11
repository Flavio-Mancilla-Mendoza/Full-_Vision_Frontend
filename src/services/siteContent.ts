// src/services/siteContent.ts
import api from "@/services/api";
import { getAuthToken } from "@/services/admin/helpers";
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

// ==================== GESTIÓN ADMIN (via API Gateway) ====================

// Actualizar contenido existente
export async function updateSiteContent(id: string, updates: ContentUpdateData): Promise<SiteContent> {
  const token = await getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${api.getApiUrl()}/admin/site-content/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update site content");
  }

  return await response.json();
}

// ==================== UPLOAD DE IMÁGENES (via API Gateway) ====================

export async function uploadSiteImage(file: File, folder: string = "general", contentId?: string): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new Error("Authentication required");

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const response = await fetch(`${api.getApiUrl()}/admin/site-content/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileData: base64,
      contentType: file.type,
      folder,
      contentId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to upload image");
  }

  const data = await response.json();
  return data.url;
}

// Eliminar imagen del storage
export async function deleteSiteImage(imagePath: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${api.getApiUrl()}/admin/site-content/image`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imagePath }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to delete image");
  }
}
