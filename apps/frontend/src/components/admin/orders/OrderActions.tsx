import React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { Order } from "@/types";

export const OrderActions: React.FC<{ order: Order; onView: (o: Order) => void }> = ({ order, onView }) => {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => onView(order)}>
        <Eye className="h-4 w-4 mr-1" />
        Ver
      </Button>
    </div>
  );
};

export default OrderActions;
