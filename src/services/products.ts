/**
 * Products Service - API Gateway Integration
 * Este servicio reemplaza las llamadas directas a Supabase con API Gateway
 */

import { productsApi, Product } from "./api";

/**
 * Obtener todos los productos activos
 */
export async function getProducts(): Promise<Product[]> {
  return await productsApi.list();
}

/**
 * Obtener un producto por ID
 */
export async function getProduct(id: string): Promise<Product> {
  return await productsApi.get(id);
}

/**
 * Crear un nuevo producto (requiere permisos de admin)
 */
export async function createProduct(data: Partial<Product>): Promise<Product> {
  return await productsApi.create(data);
}

/**
 * Actualizar un producto existente (requiere permisos de admin)
 */
export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  return await productsApi.update(id, data);
}

/**
 * Eliminar un producto (requiere permisos de admin)
 */
export async function deleteProduct(id: string): Promise<{ message: string }> {
  return await productsApi.delete(id);
}

/**
 * Búsqueda y filtrado de productos
 * Nota: Estos métodos usan el endpoint GET /products con query params
 * El Lambda Proxy los manejará apropiadamente
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  // Por ahora retorna todos y filtra en cliente
  // TODO: Implementar query params en API Gateway
  const products = await productsApi.list();
  return products.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  // TODO: Agregar query param category_id al API Gateway
  const products = await productsApi.list();
  return products.filter((p) => p.category_id === categoryId);
}

/**
 * Obtener productos por marca
 */
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  // TODO: Agregar query param brand_id al API Gateway
  const products = await productsApi.list();
  return products.filter((p) => p.brand_id === brandId);
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  // TODO: Agregar query param featured=true al API Gateway
  const products = await productsApi.list();
  return products.filter((p) => p.is_featured).slice(0, limit);
}

/**
 * Obtener productos en oferta
 */
export async function getSaleProducts(limit = 12): Promise<Product[]> {
  const products = await productsApi.list();
  return products.filter((p) => p.sale_price && p.sale_price < p.base_price).slice(0, limit);
}

/**
 * Verificar disponibilidad de stock
 */
export async function checkStock(productId: string): Promise<{ available: boolean; quantity: number }> {
  const product = await productsApi.get(productId);
  return {
    available: product.stock_quantity > 0,
    quantity: product.stock_quantity,
  };
}

// Re-export types from api.ts
export type { Product } from "./api";
