# Estrategia de Manejo de Datos de Pedidos - Full Vision

## 📊 **Problema Actual**

Tu sistema de pedidos actualmente carga **todos los datos de una vez** sin paginación, lo que puede causar problemas de rendimiento cuando el volumen crezca. Las consultas actuales incluyen:

- Todas las órdenes con sus items
- Información completa de productos por cada item
- Sin límites ni filtros de fecha

## 🚀 **Estrategias Recomendadas**

### 1. **Implementar Paginación Inteligente**

#### **Paginación por Cursor (Recomendado)**

```sql
-- En lugar de cargar todo, usar LIMIT y OFFSET/cursor
SELECT * FROM orders
WHERE created_at < $cursor_date
ORDER BY created_at DESC
LIMIT 50;
```

#### **Implementación en el Frontend**

```typescript
// Hook con paginación
export function useOrdersPaginated(page = 1, limit = 50) {
  return useQuery({
    queryKey: ["orders", "paginated", page, limit],
    queryFn: () => getOrdersPaginated(page, limit),
  });
}
```

### 2. **Estrategia de Archivado por Tiempo**

#### **Archivar Órdenes Antiguas (> 2 años)**

```sql
-- Tabla de archivo
CREATE TABLE orders_archived (
  LIKE orders INCLUDING ALL
);

-- Mover órdenes antiguas
INSERT INTO orders_archived
SELECT * FROM orders
WHERE created_at < NOW() - INTERVAL '2 years'
AND status IN ('delivered', 'cancelled');

-- Eliminar de tabla principal
DELETE FROM orders
WHERE created_at < NOW() - INTERVAL '2 years'
AND status IN ('delivered', 'cancelled');
```

#### **Archivar Automáticamente**

```sql
-- Función para archivar automáticamente
CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS void AS $$
BEGIN
  -- Archivar órdenes entregadas/canceladas > 2 años
  INSERT INTO orders_archived
  SELECT * FROM orders
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND status IN ('delivered', 'cancelled');

  -- Archivar items correspondientes
  INSERT INTO order_items_archived
  SELECT oi.* FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at < NOW() - INTERVAL '2 years'
  AND o.status IN ('delivered', 'cancelled');

  -- Eliminar de tablas principales
  DELETE FROM order_items
  WHERE order_id IN (
    SELECT id FROM orders
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND status IN ('delivered', 'cancelled')
  );

  DELETE FROM orders
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND status IN ('delivered', 'cancelled');
END;
$$ LANGUAGE plpgsql;
```

### 3. **Optimización de Consultas**

#### **Índices Estratégicos**

```sql
-- Índices para consultas más comunes
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Índice para búsqueda por número de orden
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

#### **Consultas Optimizadas**

```typescript
// Consulta paginada con filtros
export async function getOrdersPaginated(
  page = 1,
  limit = 50,
  filters: {
    status?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}
) {
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      order_items(count)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  // Aplicar filtros
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom.toISOString());
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo.toISOString());

  const { data, error, count } = await query;
  return { data, count, totalPages: Math.ceil(count / limit) };
}
```

### 4. **Separación de Datos por Estado**

#### **Tablas Particionadas por Estado**

```sql
-- Crear particiones por estado
CREATE TABLE orders_active PARTITION OF orders
  FOR VALUES IN ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'shipped');

CREATE TABLE orders_completed PARTITION OF orders
  FOR VALUES IN ('delivered');

CREATE TABLE orders_cancelled PARTITION OF orders
  FOR VALUES IN ('cancelled');
```

### 5. **Estrategia de Caché Inteligente**

#### **Caché por Usuario/Estado**

```typescript
// Caché separado para diferentes vistas
export function useActiveOrders() {
  return useQuery({
    queryKey: ["orders", "active"],
    queryFn: () => getOrdersByStatus(["pending", "confirmed", "processing"]),
    staleTime: 1000 * 60 * 2, // 2 minutos para órdenes activas
  });
}

export function useCompletedOrders() {
  return useQuery({
    queryKey: ["orders", "completed"],
    queryFn: () => getOrdersByStatus(["delivered"]),
    staleTime: 1000 * 60 * 30, // 30 minutos para órdenes completadas
  });
}
```

### 6. **Monitoreo y Alertas**

#### **Métricas a Monitorear**

```sql
-- Consultas lentas (> 1 segundo)
SELECT query, total_time, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Tamaño de tablas
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 📈 **Plan de Implementación por Fases**

### **Fase 1: Optimización Inmediata (1-2 semanas)**

1. ✅ Implementar paginación básica (50 órdenes por página)
2. ✅ Crear índices estratégicos
3. ✅ Optimizar consultas existentes
4. ✅ Implementar caché inteligente

### **Fase 2: Archivado (2-4 semanas)**

1. Crear tablas de archivo
2. Implementar script de archivado automático
3. Configurar job programado (ej: mensual)
4. Migrar datos históricos

### **Fase 3: Escalabilidad Avanzada (1-2 meses)**

1. Implementar particionamiento por estado
2. Configurar réplicas de lectura
3. Implementar compresión de datos antiguos
4. Configurar monitoreo avanzado

## 🎯 **Beneficios Esperados**

- **Rendimiento**: Consultas 5-10x más rápidas
- **Escalabilidad**: Soporte para 100k+ órdenes sin degradación
- **Mantenimiento**: Archivado automático reduce tamaño de BD
- **Experiencia**: Carga instantánea en interfaz de admin
- **Costos**: Reducción en costos de almacenamiento/infraestructura

## 🔧 **Herramientas Recomendadas**

- **Supabase**: Para gestión de BD y monitoreo
- **pg_stat_statements**: Para análisis de consultas lentas
- **pg_partman**: Para particionamiento automático
- **Redis**: Para caché avanzado (si es necesario)

¿Te gustaría que implemente alguna de estas estrategias específicas?</content>
<parameter name="filePath">c:\Users\flavi\OneDrive\Documentos\develop\full-vision-react\docs\PEDIDOS_ESCALABILIDAD.md
