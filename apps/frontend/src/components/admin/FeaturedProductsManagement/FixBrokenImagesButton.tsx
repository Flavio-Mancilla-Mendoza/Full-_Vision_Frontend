import React from "react";
import { Button } from "@/components/ui/button";

interface FixBrokenImagesButtonProps {
  loading: boolean;
  onFix: () => Promise<void>;
}

export const FixBrokenImagesButton: React.FC<FixBrokenImagesButtonProps> = ({ loading, onFix }) => (
  <Button size="sm" variant="outline" onClick={onFix} disabled={loading}>
    🔧 Corregir URLs rotas
  </Button>
);
