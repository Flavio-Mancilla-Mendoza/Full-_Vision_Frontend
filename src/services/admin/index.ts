// src/services/admin/index.ts - Re-exports centralizados (backward compatibility)

// Helpers
export { parseDateInput, getAuthToken, isAdmin } from "./helpers";

// Users
export {
  getAllUsers,
  getAllUsersPaginated,
  createUser,
  updateUser,
  deactivateUser,
  type UserProfile,
} from "./users";

// Products
export {
  getAllCategories,
  getAllBrands,
  checkSKUExists,
  checkSlugExists,
  generateProductSKU,
  getAllOpticalProducts,
  getAllOpticalProductsPaginated,
  createOpticalProduct,
  updateOpticalProduct,
  deactivateProduct,
  reactivateProduct,
  reactivateOrderProducts,
  deleteOpticalProduct,
} from "./products";

// Orders
export {
  getAllOrders,
  getAllOrdersPaginated,
  getUserOrders,
  createOrder,
  updateOrderStatus,
  generateOrderNumber,
  createOrderFromCart,
  getOrderStatusCounts,
  type OrderStatusCounts,
} from "./orders";

// Locations
export {
  getAllLocations,
  getAllLocationsPaginated,
  createLocation,
  updateLocation,
  deleteLocation,
  checkLocationHasAppointments,
} from "./locations";

// Appointments
export {
  getAllEyeExamAppointments,
  createEyeExamAppointment,
  updateEyeExamAppointment,
  type EyeExamAppointment,
} from "./appointments";

// Images
export {
  uploadProductImage,
  deleteProductImageFromS3,
  deleteProductImageFromStorage,
  createProductImageRecord,
  updateProductImageRecord,
  deleteProductImageRecord,
  getProductImages,
  setProductPrimaryImage,
  fixBrokenImageUrls,
} from "./images";

// Dashboard
export { getDashboardStats, type DashboardStats } from "./dashboard";

// Featured / Best Sellers
export {
  getFeaturedProducts,
  setProductAsFeatured,
  getAvailableProductsForFeatured,
  getBestSellingProducts,
} from "./featured";
