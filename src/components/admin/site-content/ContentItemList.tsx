import React from "react";
import { ImageContentItem } from "./ImageContentItem";
import { TextContentItem } from "./TextContentItem";
import type { SiteContent, ContentUpdateData } from "@/services/siteContent";

interface ContentItemListProps {
  items: SiteContent[];
  editing: string | null;
  uploading: string | null;
  onEdit: (id: string | null) => void;
  onUpload: (id: string, file: File) => void;
  onUpdate: (id: string, updates: ContentUpdateData) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

/**
 * Renderiza una lista de SiteContent items, eligiendo automáticamente
 * entre ImageContentItem y TextContentItem según content_type.
 */
export const ContentItemList: React.FC<ContentItemListProps> = ({
  items,
  editing,
  uploading,
  onEdit,
  onUpload,
  onUpdate,
  onToggleActive,
}) => (
  <>
    {items.map((item) =>
      item.content_type === "image" ? (
        <ImageContentItem
          key={item.id}
          item={item}
          editing={editing}
          uploading={uploading}
          onEdit={onEdit}
          onUpload={onUpload}
          onUpdate={onUpdate}
          onToggleActive={onToggleActive}
        />
      ) : (
        <TextContentItem
          key={item.id}
          item={item}
          editing={editing}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onToggleActive={onToggleActive}
        />
      ),
    )}
  </>
);
