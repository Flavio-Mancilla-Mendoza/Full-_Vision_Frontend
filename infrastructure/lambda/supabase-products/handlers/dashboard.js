// Handler para estadisticas del dashboard admin
const { getCorsHeaders } = require('../shared/cors');

function isAdminUser(user) {
  return user && user.groups && (user.groups.includes('Admins') || user.groups.includes('admin'));
}

module.exports = async function handleDashboard({ method, user, supabase, logger, normalizedRequest }) {
  const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;

  if (method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers: getCorsHeaders(origin) };
  }

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers: getCorsHeaders(origin) };
  }

  if (!isAdminUser(user)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers: getCorsHeaders(origin) };
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      users,
      products,
      orders,
      appointments,
      locations,
      recentOrders,
      recentAppointments,
    ] = await Promise.all([
      supabase.from('profiles').select('id, is_active', { count: 'exact' }),
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('orders').select('id, total_amount', { count: 'exact' }),
      supabase.from('eye_exam_appointments').select('id', { count: 'exact' }),
      supabase.from('eye_exam_locations').select('id', { count: 'exact' }),
      supabase.from('orders').select('id, total_amount').gte('created_at', weekAgo),
      supabase.from('eye_exam_appointments').select('id').gte('created_at', weekAgo),
    ]);

    if (users.error || products.error || orders.error || appointments.error || locations.error || recentOrders.error || recentAppointments.error) {
      const message = [
        users.error?.message,
        products.error?.message,
        orders.error?.message,
        appointments.error?.message,
        locations.error?.message,
        recentOrders.error?.message,
        recentAppointments.error?.message,
      ]
        .filter(Boolean)
        .join(' | ');
      throw new Error(message || 'Error fetching dashboard stats');
    }

    const totalRevenue = orders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const averageOrderValue = orders.count ? totalRevenue / orders.count : 0;
    const activeUsers = users.data?.filter((profile) => profile.is_active).length || 0;

    const stats = {
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

    return { statusCode: 200, body: JSON.stringify(stats), headers: getCorsHeaders(origin) };
  } catch (err) {
    logger.error('Dashboard stats error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
      headers: getCorsHeaders(origin),
    };
  }
};
