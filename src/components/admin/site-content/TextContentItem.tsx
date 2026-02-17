import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, EyeOff } from "lucide-react";
import type { SiteContent, ContentUpdateData } from "@/services/siteContent";

interface TextContentItemProps {
  item: SiteContent;
  editing: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (id: string, updates: ContentUpdateData) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export const TextContentItem: React.FC<TextContentItemProps> = ({
  item,
  editing,
  onEdit,
  onUpdate,
  onToggleActive,
}) => {
  const [editValue, setEditValue] = useState(item.value);
  const isEditing = editing === item.id;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{item.key}</CardTitle>
            <CardDescription>Texto - {item.section}</CardDescription>
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
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`text-${item.id}`}>Contenido</Label>
              <Textarea id={`text-${item.id}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => onUpdate(item.id, { value: editValue })} size="sm">
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
            <p className="text-sm">{item.value}</p>
            <Button variant="outline" onClick={() => onEdit(item.id)} size="sm">
              Editar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
