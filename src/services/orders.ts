/**
 * Orders Service - API Gateway Integration
 * Este servicio maneja las órdenes a través del API Gateway
 */

import { ordersApi } from "./api";
import type { Order } from "@/types";

/**
 * Obtener todas las órdenes del usuario
 * Los usuarios regulares solo verán sus propias órdenes
 * Los admins verán todas las órdenes
 */
export async function getOrders(): Promise<Order[]> {
  return (await ordersApi.list()) as unknown as Order[];
}

/**
 * Obtener una orden específica por ID
 */
export async function getOrder(id: string): Promise<Order> {
  return (await ordersApi.get(id)) as unknown as Order;
}

/**
 * Crear una nueva orden
 */
export async function createOrder(data: Partial<Order>): Promise<Order> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await ordersApi.create(data as any)) as unknown as Order;
}

/**
 * Actualizar una orden existente
 * Los usuarios pueden actualizar solo sus propias órdenes
 * Los admins pueden actualizar cualquier orden
 */
export async function updateOrder(id: string, data: Partial<Order>): Promise<Order> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await ordersApi.update(id, data as any)) as unknown as Order;
}

/**
 * Obtener órdenes por estado
 */
export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const orders = (await ordersApi.list()) as unknown as Order[];
  return orders.filter((o) => o.status === status);
}

/**
 * Obtener historial de órdenes del usuario
 */
export async function getOrderHistory(): Promise<Order[]> {
  return (await ordersApi.list()) as unknown as Order[];
}

/**
 * Cancelar una orden
 */
export async function cancelOrder(id: string): Promise<Order> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await ordersApi.update(id, { status: "cancelled" } as any)) as unknown as Order;
}

// Re-export types from @/types
export type { Order } from "@/types";
