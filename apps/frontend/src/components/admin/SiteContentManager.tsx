// src/components/admin/SiteContentManager.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Save, Eye, EyeOff, RefreshCw } from "lucide-react";
import { getAllSiteContent, updateSiteContent, uploadSiteImage, deleteSiteImage, type SiteContent } from "@/services/siteContent";

const SiteContentManager = () => {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
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
  };

  const handleImageUpload = async (contentId: string, file: File) => {
    try {
      setUploading(contentId);

      // Subir nueva imagen
      const imageUrl = await uploadSiteImage(file, "hero");

      // Actualizar contenido con la nueva URL
      await updateSiteContent(contentId, { value: imageUrl });

      // Recargar contenido
      await loadContent();

      toast({
        title: "Éxito",
        description: "Imagen actualizada correctamente",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleContentUpdate = async (contentId: string, updates: Partial<SiteContent>) => {
    try {
      await updateSiteContent(contentId, updates);
      await loadContent();
      setEditing(null);

      toast({
        title: "Éxito",
        description: "Contenido actualizado correctamente",
      });
    } catch (error) {
      console.error("Error updating content:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el contenido",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async (contentId: string, isActive: boolean) => {
    try {
      await updateSiteContent(contentId, { is_active: isActive });
      await loadContent();

      toast({
        title: "Éxito",
        description: `Contenido ${isActive ? "activado" : "desactivado"} correctamente`,
      });
    } catch (error) {
      console.error("Error toggling content:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del contenido",
        variant: "destructive",
      });
    }
  };

  const getContentBySection = (section: string) => {
    return content.filter((item) => item.section === section);
  };

  const ImageContentItem = ({ item }: { item: SiteContent }) => {
    const [editValue, setEditValue] = useState(item.value);
    const [editAltText, setEditAltText] = useState(item.alt_text || "");

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{item.key}</CardTitle>
              <CardDescription>Imagen - {item.section}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Activo" : "Inactivo"}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleActiveStatus(item.id, !item.is_active)}>
                {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Vista previa de la imagen actual */}
          <div className="mb-4">
            <img
              src={item.value}
              alt={item.alt_text || "Imagen del sitio"}
              className={`w-full ${
                item.key === "promo_banner" ? "max-w-md aspect-square" : "max-w-md h-32"
              } object-cover rounded-lg border`}
            />
            {item.key === "promo_banner" && (
              <p className="text-xs text-muted-foreground mt-2">📱 Esta imagen se mostrará como pop-up cuadrado al entrar a la página</p>
            )}
          </div>

          {/* Upload de nueva imagen */}
          <div className="mb-4">
            <Label htmlFor={`image-${item.id}`}>Cambiar imagen</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id={`image-${item.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(item.id, file);
                  }
                }}
                disabled={uploading === item.id}
              />
              {uploading === item.id && <RefreshCw className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          {/* Editar URL y alt text */}
          {editing === item.id ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`url-${item.id}`}>URL de la imagen</Label>
                <Input id={`url-${item.id}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor={`alt-${item.id}`}>Texto alternativo</Label>
                <Input
                  id={`alt-${item.id}`}
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Descripción de la imagen"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleContentUpdate(item.id, {
                      value: editValue,
                      alt_text: editAltText,
                    })
                  }
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)} size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>URL:</strong> {item.value}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Alt text:</strong> {item.alt_text || "Sin texto alternativo"}
              </p>
              <Button variant="outline" onClick={() => setEditing(item.id)} size="sm">
                Editar detalles
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const TextContentItem = ({ item }: { item: SiteContent }) => {
    const [editValue, setEditValue] = useState(item.value);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{item.key}</CardTitle>
              <CardDescription>Texto - {item.section}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Activo" : "Inactivo"}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleActiveStatus(item.id, !item.is_active)}>
                {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing === item.id ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`text-${item.id}`}>Contenido</Label>
                <Textarea id={`text-${item.id}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleContentUpdate(item.id, { value: editValue })} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)} size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">{item.value}</p>
              <Button variant="outline" onClick={() => setEditing(item.id)} size="sm">
                Editar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gestión de Contenido del Sitio</h2>
        </div>
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Contenido del Sitio</h2>
        <Button onClick={loadContent} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList>
          <TabsTrigger value="hero">Hero Principal</TabsTrigger>
          <TabsTrigger value="banner">Banners</TabsTrigger>
          <TabsTrigger value="all">Todo el Contenido</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sección Hero - Página Principal</CardTitle>
              <CardDescription>Gestiona la imagen y textos principales de la homepage</CardDescription>
            </CardHeader>
          </Card>

          {getContentBySection("hero").map((item) => (
            <div key={item.id}>{item.content_type === "image" ? <ImageContentItem item={item} /> : <TextContentItem item={item} />}</div>
          ))}
        </TabsContent>

        <TabsContent value="banner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banners y Promociones</CardTitle>
              <CardDescription>
                Gestiona banners promocionales. El banner "promo_banner" se mostrará como pop-up modal al ingresar a la página.
                {getContentBySection("banner").find((item) => item.key === "promo_banner")?.is_active
                  ? " ✅ Modal promocional ACTIVO - Se mostrará al entrar al sitio"
                  : " ⚠️ Modal promocional INACTIVO - No se mostrará"}
              </CardDescription>
            </CardHeader>
          </Card>

          {getContentBySection("banner").map((item) => (
            <div key={item.id}>{item.content_type === "image" ? <ImageContentItem item={item} /> : <TextContentItem item={item} />}</div>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todo el Contenido</CardTitle>
              <CardDescription>Vista completa de todo el contenido del sitio</CardDescription>
            </CardHeader>
          </Card>

          {content.map((item) => (
            <div key={item.id}>{item.content_type === "image" ? <ImageContentItem item={item} /> : <TextContentItem item={item} />}</div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteContentManager;
