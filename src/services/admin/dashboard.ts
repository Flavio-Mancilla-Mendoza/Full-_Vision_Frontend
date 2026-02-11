// src/services/admin/dashboard.ts - Estadísticas del dashboard (Admin)
import { getApiUrl } from "@/services/api";
import { getAuthToken } from "./helpers";

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalAppointments: number;
  totalLocations: number;
  recentOrders: number;
  recentAppointments: number;
  activeUsers: number;
  totalRevenue: number;
  averageOrderValue: number;
  productsByCategory: { category: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  topSellingProducts: { name: string; quantity: number }[];
}

/**
 * Obtener estadísticas completas del dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${getApiUrl()}/admin/dashboard/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch dashboard stats");
  }

  return await response.json();
}
