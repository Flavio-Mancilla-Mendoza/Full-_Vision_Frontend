import api from "@/services/api";
import type { Brand } from "@/types";
export type { Brand } from "@/types";

// Obtener todas las marcas activas (público - sin autenticación)
export const getAllBrands = async (): Promise<Brand[]> => {
  try {
    return await api.brands.getPublic();
  } catch (error) {
    console.error("Error fetching brands from API:", error);
    return [];
  }
};

// Crear una nueva marca (requiere autenticación y permisos de admin)
export const createBrand = async (brandData: { name: string; slug?: string; description?: string }): Promise<Brand> => {
  try {
    return await api.brands.create(brandData);
  } catch (error) {
    console.error("Error creating brand:", error);
    throw error;
  }
};

// Verificar si una marca ya existe por nombre (público)
export const checkBrandExists = async (name: string): Promise<boolean> => {
  try {
    return await api.brands.checkExists(name);
  } catch (error) {
    console.error("Error checking brand existence:", error);
    // En caso de error, asumir que no existe para permitir continuar
    return false;
  }
};
