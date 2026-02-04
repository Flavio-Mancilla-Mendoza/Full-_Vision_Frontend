// src/components/cart/GuestCartNotice.tsx - Aviso para usuarios anónimos
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Heart, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GuestCartNoticeProps {
  className?: string;
}

export default function GuestCartNotice({ className }: GuestCartNoticeProps) {
  const navigate = useNavigate();

  return (
    <Card className={`border-amber-200 bg-amber-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-5 h-5 text-amber-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 mb-2">¡Crea una cuenta y obtén beneficios exclusivos!</h3>

            <p className="text-sm text-amber-800 mb-4">Puedes comprar sin registrarte, pero al crear una cuenta obtienes:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Carrito persistente</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Heart className="w-4 h-4 text-amber-600" />
                <span>Lista de favoritos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Gift className="w-4 h-4 text-amber-600" />
                <span>Ofertas exclusivas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Historial de compras</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" onClick={() => navigate("/register")} className="bg-amber-600 hover:bg-amber-700 text-white">
                Crear cuenta gratis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Ya tengo cuenta
              </Button>
            </div>
          </div>

          <Badge variant="secondary" className="bg-amber-200 text-amber-800 hidden sm:block">
            Opcional
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
