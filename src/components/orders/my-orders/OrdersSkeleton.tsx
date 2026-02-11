// src/components/orders/my-orders/OrdersSkeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="h-16 w-16 bg-gray-200 rounded" />
              <div className="h-16 w-16 bg-gray-200 rounded" />
              <div className="h-16 w-16 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
