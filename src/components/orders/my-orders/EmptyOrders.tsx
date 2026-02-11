// src/components/orders/my-orders/EmptyOrders.tsx
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingBag } from "lucide-react";

export default function EmptyOrders() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
        <p className="text-muted-foreground mb-6 text-center">
          Cuando realices un pedido, aparecerá aquí para que puedas hacer seguimiento
        </p>
        <Button asChild>
          <Link to="/productos">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Ir a comprar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
