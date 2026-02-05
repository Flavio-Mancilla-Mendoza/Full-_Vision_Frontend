/**
 * ⚠️ ARCHIVO AUTO-GENERADO - NO EDITAR MANUALMENTE
 * 
 * Este archivo contiene los tipos TypeScript generados desde el esquema de Supabase.
 * 
 * Para regenerar este archivo, ejecuta:
 * ```bash
 * npm run db:types
 * # o
 * npx supabase gen types typescript --project-id txjryksczwwthbgmmjms > src/types/database-new.ts
 * ```
 * 
 * Última actualización: 2026-02-04
 * 
 * @see https://supabase.com/docs/guides/api/generating-types
 */

// ============================================
// GUÍA DE USO
// ============================================
/**
 * Este archivo exporta tipos para:
 * 
 * 1. Database - Interface principal con todas las tablas
 * 2. TimestampFields - Helper para campos de fecha
 * 3. OrderStatus - Enum de estados de orden
 * 4. AppointmentStatus - Enum de estados de cita
 * 5. UserRole - Enum de roles de usuario
 * 6. PrescriptionData - Estructura de prescripción médica
 * 
 * USO RECOMENDADO:
 * 
 * ```typescript
 * import { Database } from '@/types/database';
 * 
 * // Tipos de fila
 * type Product = Database['public']['Tables']['products']['Row'];
 * 
 * // Tipos de inserción
 * type NewProduct = Database['public']['Tables']['products']['Insert'];
 * 
 * // Tipos de actualización
 * type ProductUpdate = Database['public']['Tables']['products']['Update'];
 * ```
 * 
 * MEJORES PRÁCTICAS:
 * - No editar manualmente este archivo
 * - Regenerar después de cambios en el esquema de BD
 * - Usar tipos derivados en src/types/index.ts para mejor abstracción
 */