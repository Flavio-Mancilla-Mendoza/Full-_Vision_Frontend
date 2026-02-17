import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, EyeOff, RefreshCw } from "lucide-react";
import type { SiteContent, ContentUpdateData } from "@/services/siteContent";

interface ImageContentItemProps {
  item: SiteContent;
  editing: string | null;
  uploading: string | null;
  onEdit: (id: string | null) => void;
  onUpload: (id: string, file: File) => void;
  onUpdate: (id: string, updates: ContentUpdateData) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export const ImageContentItem: React.FC<ImageContentItemProps> = ({
  item,
  editing,
  uploading,
  onEdit,
  onUpload,
  onUpdate,
  onToggleActive,
}) => {
  const [editValue, setEditValue] = useState(item.value);
  const [editAltText, setEditAltText] = useState(item.alt_text || "");
  const isEditing = editing === item.id;
  const isUploading = uploading === item.id;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{item.key}</CardTitle>
            <CardDescription>Imagen - {item.section}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={item.is_active ? "default" : "secondary"}>
              {item.is_active ? "Activo" : "Inactivo"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => onToggleActive(item.id, !item.is_active)}>
              {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Vista previa */}
        <div className="mb-4">
          <img
            src={item.value}
            alt={item.alt_text || "Imagen del sitio"}
            className={`w-full ${
              item.key === "promo_banner" ? "max-w-md aspect-square" : "max-w-md h-32"
            } object-cover rounded-lg border`}
          />
          {item.key === "promo_banner" && (
            <p className="text-xs text-muted-foreground mt-2">
              📱 Esta imagen se mostrará como pop-up cuadrado al entrar a la página
            </p>
          )}
        </div>

        {/* Upload */}
        <div className="mb-4">
          <Label htmlFor={`image-${item.id}`}>Cambiar imagen</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id={`image-${item.id}`}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(item.id, file);
              }}
              disabled={isUploading}
            />
            {isUploading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>
        </div>

        {/* Editar URL y alt text */}
        {isEditing ? (
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
              <Button onClick={() => onUpdate(item.id, { value: editValue, alt_text: editAltText })} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => onEdit(null)} size="sm">
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
            <Button variant="outline" onClick={() => onEdit(item.id)} size="sm">
              Editar detalles
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
