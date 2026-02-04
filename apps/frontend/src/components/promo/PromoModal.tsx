// src/components/promo/PromoModal.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

const PromoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenPromo, setHasSeenPromo] = useState(false);
  const { content, loading } = useSiteContent("banner");

  useEffect(() => {
    // Verificar si el usuario ya vio el promo en esta sesión
    const seenPromo = sessionStorage.getItem("promo_seen");

    if (seenPromo) {
      setHasSeenPromo(true);
      return;
    }

    // Esperar a que cargue el contenido
    if (!loading && content.length > 0) {
      // Buscar el promo_banner activo
      const promoBanner = content.find((item) => item.key === "promo_banner" && item.is_active);

      if (promoBanner) {
        // Mostrar modal después de 1 segundo
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [content, loading]);

  const handleClose = () => {
    setIsOpen(false);
    // Guardar en sessionStorage que ya vio el promo
    sessionStorage.setItem("promo_seen", "true");
    setHasSeenPromo(true);
  };

  // No mostrar si ya vio el promo o si está cargando
  if (hasSeenPromo || loading) {
    return null;
  }

  // Obtener el banner activo
  const promoBanner = content.find((item) => item.key === "promo_banner" && item.is_active);

  // Si no hay banner activo, no mostrar nada
  if (!promoBanner) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-2xl w-[90vw] h-auto p-0 overflow-hidden rounded-lg border-0"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
      >
        {/* Botón de cerrar personalizado */}
        <DialogClose
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </DialogClose>

        {/* Imagen del banner - Cuadrada y grande */}
        <div className="relative w-full aspect-square">
          <img
            src={promoBanner.value}
            alt={promoBanner.alt_text || "Promoción especial"}
            className="w-full h-full object-cover"
            loading="eager"
            onClick={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoModal;
