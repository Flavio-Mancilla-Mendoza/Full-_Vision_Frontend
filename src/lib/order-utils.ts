// src/lib/order-utils.ts - Utilidades centralizadas para órdenes
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { OrderStatus } from "@/types";

// ─── Status Configuration ────────────────────────────────────────────
export interface OrderStatusConfig {
  icon: LucideIcon;
  variant: "default" | "destructive" | "outline" | "secondary";
  label: string;
  color: string;
}

const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = {
  pending: { icon: Clock, variant: "secondary", label: "Pendiente", color: "text-yellow-600" },
  confirmed: { icon: CheckCircle2, variant: "default", label: "Confirmado", color: "text-blue-600" },
  processing: { icon: Package, variant: "default", label: "Procesando", color: "text-blue-600" },
  ready_for_pickup: { icon: ShoppingBag, variant: "default", label: "Listo para Recojo", color: "text-green-600" },
  shipped: { icon: Truck, variant: "default", label: "Enviado", color: "text-green-600" },
  delivered: { icon: CheckCircle2, variant: "default", label: "Entregado", color: "text-green-600" },
  cancelled: { icon: XCircle, variant: "destructive", label: "Cancelado", color: "text-red-600" },
};

const DEFAULT_STATUS_CONFIG: OrderStatusConfig = {
  icon: Package,
  variant: "outline",
  label: "Desconocido",
  color: "text-gray-600",
};

export function getOrderStatusConfig(status: string): OrderStatusConfig {
  return ORDER_STATUS_MAP[status as OrderStatus] ?? { ...DEFAULT_STATUS_CONFIG, label: status };
}

// ─── Formatting Helpers ──────────────────────────────────────────────
export function formatCurrency(amount: number | null | undefined): string {
  return `S/ ${(amount ?? 0).toFixed(2)}`;
}

export function formatOrderDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getItemPrice(item: {
  unit_price?: number;
  total_price?: number;
  quantity?: number;
}): { unitPrice: number; totalPrice: number } {
  const unitPrice = item.unit_price ?? 0;
  const totalPrice = item.total_price ?? item.quantity! * unitPrice;
  return { unitPrice, totalPrice };
}
