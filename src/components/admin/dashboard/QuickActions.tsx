import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, PackagePlus, Star, MapPinPlus } from "lucide-react";

interface QuickActionsProps {
  onNavigateTab: (tab: string) => void;
}

const actions = [
  { tab: "users", icon: UserPlus, title: "Nuevo Usuario", description: "Crear cuenta de usuario" },
  { tab: "products", icon: PackagePlus, title: "Nuevo Producto", description: "Añadir al catálogo" },
  { tab: "featured", icon: Star, title: "Productos Destacados", description: "Gestionar homepage" },
  { tab: "locations", icon: MapPinPlus, title: "Nueva Ubicación", description: "Configurar centro" },
] as const;

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigateTab }) => (
  <Card>
    <CardHeader>
      <CardTitle>Acciones Rápidas</CardTitle>
      <CardDescription>Acceso directo a las operaciones más comunes</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ tab, icon: Icon, title, description }) => (
          <Button
            key={tab}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2"
            onClick={() => onNavigateTab(tab)}
          >
            <Icon className="w-6 h-6" />
            <div className="text-left">
              <div className="font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
            </div>
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);
