import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadDropzoneProps {
  dragOver: boolean;
  maxImages: number;
  maxSize: number;
  acceptedTypes: string[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  setDragOver: (drag: boolean) => void;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  dragOver,
  maxImages,
  maxSize,
  acceptedTypes,
  handleFileSelect,
  handleDrop,
  setDragOver,
}) => (
  <Card
    className={`border-2 border-dashed transition-colors ${
      dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
    }`}
    onDragOver={(e) => {
      e.preventDefault();
      setDragOver(true);
    }}
    onDragLeave={(e) => {
      e.preventDefault();
      setDragOver(false);
    }}
    onDrop={handleDrop}
  >
    <CardContent className="p-6 text-center">
      <Upload className="size-12 mx-auto mb-4 text-gray-500" />
      <p className="text-lg font-medium mb-2">Arrastra imágenes aquí o haz clic para seleccionar</p>
      <p className="text-sm mb-4">
        Máximo {maxImages} imágenes • Hasta {(maxSize / 1024 / 1024).toFixed(1)}MB cada una
      </p>
      <p className="text-xs mb-4">
        Formatos:{" "}
        {acceptedTypes
          .map((type) => type.split("/")[1])
          .join(", ")
          .toUpperCase()}
      </p>
      <Input type="file" multiple accept={acceptedTypes.join(",")} onChange={handleFileSelect} className="hidden" id="image-upload" />
      <Button asChild variant="outline">
        <label htmlFor="image-upload" className="cursor-pointer">
          <ImageIcon className="size-4 mr-2" />
          Seleccionar Imágenes
        </label>
      </Button>
    </CardContent>
  </Card>
);
