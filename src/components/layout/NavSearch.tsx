// Componente de búsqueda del Navbar
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavSearchProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function NavSearch({ isOpen, onOpen, onClose }: NavSearchProps) {
  if (isOpen) {
    return (
      <div className="flex items-center space-x-2 animate-fade-in">
        <Input type="search" placeholder="Buscar..." className="w-48 h-9" autoFocus />
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onOpen}>
      <Search className="h-4 w-4" />
    </Button>
  );
}
