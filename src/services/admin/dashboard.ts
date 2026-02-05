// src/services/admin/dashboard.ts - Estadísticas del dashboard (Admin)
import { supabase } from "@/lib/supabase";

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
  const [users, products, orders, appointments, locations, recentOrders, recentAppointments] = await Promise.all([
    supabase.from("profiles").select("id, is_active", { count: "exact" }),
    supabase.from("products").select("id", { count: "exact" }),
    supabase.from("orders").select("id, total_amount", { count: "exact" }),
    supabase.from("eye_exam_appointments").select("id", { count: "exact" }),
    supabase.from("eye_exam_locations").select("id", { count: "exact" }),
    supabase
      .from("orders")
      .select("id, total_amount")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("eye_exam_appointments")
      .select("id")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalRevenue = orders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const averageOrderValue = orders.count ? totalRevenue / orders.count : 0;
  const activeUsers = users.data?.filter((user) => user.is_active).length || 0;

  return {
    totalUsers: users.count || 0,
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalAppointments: appointments.count || 0,
    totalLocations: locations.count || 0,
    recentOrders: recentOrders.data?.length || 0,
    recentAppointments: recentAppointments.data?.length || 0,
    activeUsers,
    totalRevenue,
    averageOrderValue,
    productsByCategory: [],
    ordersByStatus: [],
    appointmentsByStatus: [],
    topSellingProducts: [],
  };
}
