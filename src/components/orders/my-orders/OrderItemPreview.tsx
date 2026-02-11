// src/components/orders/my-orders/OrderItemPreview.tsx
import type { OrderItem } from "@/types";

interface OrderItemPreviewProps {
  items: OrderItem[];
  maxVisible?: number;
}

export default function OrderItemPreview({ items, maxVisible = 3 }: OrderItemPreviewProps) {
  if (!items.length) return null;

  const visible = items.slice(0, maxVisible);
  const remaining = items.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-3">
      {visible.map((item) => (
        <div key={item.id} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
          {item.product?.product_images?.[0]?.url && (
            <img
              src={item.product.product_images[0].url}
              alt={item.product.name ?? "Producto"}
              className="w-12 h-12 object-cover rounded"
            />
          )}
          <div className="text-sm">
            <p className="font-medium truncate max-w-[150px]">
              {item.product?.name ?? "Producto"}
            </p>
            <p className="text-muted-foreground">Cant: {item.quantity}</p>
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2 px-4 text-sm text-muted-foreground">
          +{remaining} más
        </div>
      )}
    </div>
  );
}
