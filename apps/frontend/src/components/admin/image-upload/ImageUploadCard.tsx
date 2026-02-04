import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Star } from "lucide-react";
import type { UploadingImage } from "@/types/image";

interface ImageUploadCardProps {
  image: UploadingImage;
  index: number;
  setImages: (images: UploadingImage[]) => void;
  images: UploadingImage[];
  removeImage: (index: number) => void;
  setPrimaryImage: (index: number) => void;
}

export const ImageUploadCard: React.FC<ImageUploadCardProps> = ({ image, index, setImages, images, removeImage, setPrimaryImage }) => (
  <Card className="relative group">
    <CardContent className="p-2">
      <div className="relative aspect-square">
        <img src={image.url} alt={image.alt_text || `Imagen ${index + 1}`} className="w-full h-full object-cover rounded" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
          {!image.is_primary && (
            <Button size="sm" variant="secondary" onClick={() => setPrimaryImage(index)} className="h-8 w-8 p-0">
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => removeImage(index)} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {image.is_primary && (
          <Badge className="absolute top-2 left-2 bg-yellow-500">
            <Star className="w-3 h-3 mr-1" />
            Principal
          </Badge>
        )}
        {image.uploading && (
          <div className="absolute bottom-2 left-2 right-2">
            <Progress value={image.progress || 0} className="h-2" />
          </div>
        )}
      </div>
      <Input
        value={image.alt_text || ""}
        onChange={(e) => {
          const updated = images.map((img, i) => (i === index ? { ...img, alt_text: e.target.value } : img));
          setImages(updated);
        }}
        placeholder="Texto alternativo"
        className="mt-2 text-xs"
      />
    </CardContent>
  </Card>
);
