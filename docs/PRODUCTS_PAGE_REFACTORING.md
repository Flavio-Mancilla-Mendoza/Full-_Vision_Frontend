# Refactorización ProductsPage - Separación de Lógica de Negocio

## Resumen

Se ha completado la refactorización del componente `ProductsPage.tsx`, separando la lógica de negocio del componente UI y modularizando en componentes más pequeños y reutilizables.

## ✅ Lógica de Negocio en el Lambda (Backend)

La **lógica principal ya está implementada en el backend** ([shared/src/handlers/productsHandler.js](../shared/src/handlers/productsHandler.js)):

### Funciones del Lambda:
1. **`getProductsWithFilters`**: Filtrado, ordenamiento y paginación de productos
   - Filtrado por género, marcas, descuentos, precio, atributos dinámicos
   - Ordenamiento (featured, price_asc, price_desc, discount)
   - Paginación con límites configurables
   - Queries optimizadas con Supabase

2. **`getDynamicFilters`**: Cálculo de filtros disponibles
   - Descuentos agrupados (50%, 30%, 20%)
   - Marcas con conteo de productos
   - Rango de precios (min/max) basado en productos reales

3. **`getDynamicAttributes`**: Atributos dinámicos
   - Frame size, frame material, lens type
   - Valores únicos con conteo

## 📁 Archivos Creados/Modificados

### 1. **Utilidades Puras** ([src/lib/product-utils.ts](../src/lib/product-utils.ts))

Funciones sin efectos secundarios para transformaciones de datos:

```typescript
formatPrice(price: number): string
transformProductForCart(product: IProduct): OpticalProduct
calculateMinDiscount(discounts: string[]): number | undefined
```

**Beneficios:**
- ✅ Fácilmente testeable con unit tests
- ✅ Reutilizable en toda la aplicación
- ✅ Sin dependencias de React

---

### 2. **Custom Hook de Filtros** ([src/hooks/useProductFilters.ts](../src/hooks/useProductFilters.ts))

Maneja toda la lógica de estado y transformación de filtros:

```typescript
useProductFilters(gender, options) → {
  filters,              // Estado UI de filtros
  backendFilters,       // Filtros transformados para API
  openSections,         // Estado de acordeones
  activeFiltersCount,   // Conteo de filtros activos
  updateFilter,         // Actualizar un filtro
  toggleFilterValue,    // Toggle valor en array
  clearFilters,         // Resetear todos
  toggleSection         // Abrir/cerrar acordeón
}
```

**Responsabilidades:**
- ✅ Gestión de estado de filtros
- ✅ Construcción de filtros para backend
- ✅ Conteo de filtros activos
- ✅ Reseteo de filtros con valores por defecto

---

### 3. **Componentes Modulares**

#### a) **FilterSidebar** ([src/components/products/FilterSidebar.tsx](../src/components/products/FilterSidebar.tsx))
Sidebar completo con todos los filtros:
- Descuentos Cyber
- Marcas
- Rango de precio (Slider)
- Filtros dinámicos (frame_size, frame_material, etc.)
- Botón de limpiar filtros

**Props:** Recibe filtros, opciones, callbacks (separación de concerns)

#### b) **ProductGrid** ([src/components/products/ProductGrid.tsx](../src/components/products/ProductGrid.tsx))
Grid de productos con:
- Estado vacío con mensaje y botón de reseteo
- Grid responsive (1-3 columnas)
- Lazy loading de imágenes
- Integración con carrito

#### c) **Pagination** ([src/components/products/Pagination.tsx](../src/components/products/Pagination.tsx))
Componente de paginación inteligente:
- Muestra solo páginas cercanas (actual ±2)
- Elipsis para rangos largos
- Botones prev/next con disabled states

---

### 4. **ProductsPage Refactorizado** ([src/components/products/ProductsPage.tsx](../src/components/products/ProductsPage.tsx))

**ANTES: 533 líneas** con lógica mezclada  
**AHORA: ~230 líneas** solo orquestación y UI

```typescript
// Solo responsabilidades de UI y orquestación:
const ProductsPage = ({ gender, title, ... }) => {
  // 1. Hooks de datos (React Query)
  const { data: dynamicFiltersData } = useDynamicFiltersForGender(gender);
  const { data: dynamicAttributes } = useDynamicAttributesForGender(gender);
  
  // 2. Hook de lógica de filtros (custom)
  const { filters, backendFilters, ... } = useProductFilters(gender, { ... });
  
  // 3. Query de productos con filtros del backend
  const { data: productsResponse } = useProductsByGender(queryFilters);
  
  // 4. Renderizar componentes modulares
  return (
    <FilterSidebar ... />
    <ProductGrid ... />
    <Pagination ... />
  );
};
```

---

## 🎯 Mejoras Logradas

### 1. **Separación de Responsabilidades**
- ✅ **Backend (Lambda)**: Lógica de negocio compleja (filtrado, agregaciones)
- ✅ **Custom Hook**: Lógica de estado y transformación de datos
- ✅ **Utilidades**: Funciones puras reutilizables
- ✅ **Componentes**: Solo presentación y orquestación

### 2. **Testabilidad**
```typescript
// Ahora puedes testear cada parte independientemente:

// Test utilidades (unit test)
expect(calculateMinDiscount(['50', '30'])).toBe(30);
expect(formatPrice(99.99)).toBe('S/ 99.99');

// Test hook (hook test con @testing-library/react-hooks)
const { result } = renderHook(() => useProductFilters('hombre'));
act(() => result.current.toggleFilterValue('brand', 'Ray-Ban'));
expect(result.current.filters.brand).toContain('Ray-Ban');

// Test componentes (component test)
render(<Pagination currentPage={2} totalPages={10} ... />);
expect(screen.getByText('2')).toHaveClass('bg-primary');
```

### 3. **Reutilización**
- 🔄 `FilterSidebar` se puede usar en otros lugares (búsqueda, catálogo)
- 🔄 `ProductGrid` reutilizable en home, ofertas, etc.
- 🔄 `Pagination` genérico para cualquier lista paginada
- 🔄 `useProductFilters` se puede adaptar para otros filtros

### 4. **Mantenibilidad**
- 📝 Cada archivo tiene una responsabilidad clara
- 📝 Más fácil encontrar y modificar código
- 📝 Componentes más pequeños y comprensibles
- 📝 Cambios aislados sin efectos colaterales

### 5. **Performance**
- ⚡ Filtrado en backend (no en frontend)
- ⚡ Memoización de cálculos con `useMemo`
- ⚡ Lazy loading de imágenes
- ⚡ Componentes más pequeños = re-renders más eficientes

---

## 🔄 Flujo de Datos

```
Usuario interactúa con filtros
    ↓
useProductFilters actualiza estado
    ↓
backendFilters se recalcula (useMemo)
    ↓
React Query detecta cambio en queryKey
    ↓
Fetch API → Lambda getProductsWithFilters
    ↓
Lambda aplica filtros en Supabase
    ↓
Retorna productos filtrados + metadata
    ↓
ProductGrid renderiza resultados
```

---

## 📊 Métricas de Refactorización

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas en ProductsPage | 533 | ~230 | -57% |
| Funciones en componente | 7 | 3 | -57% |
| Archivos creados | 1 | 6 | Modular |
| Lógica testeable | ❌ | ✅ | 100% |
| Componentes reutilizables | 0 | 3 | N/A |

---

## 🚀 Próximos Pasos (Opcional)

### 1. **Testing**
```bash
# Crear tests para:
src/__tests__/lib/product-utils.test.ts
src/__tests__/hooks/useProductFilters.test.ts
src/__tests__/components/FilterSidebar.test.tsx
src/__tests__/components/ProductGrid.test.tsx
```

### 2. **Optimizaciones Adicionales del Lambda**
- Implementar caché en Redis para filtros frecuentes
- Índices en Supabase para queries complejas
- Agregar logging estructurado para debugging

### 3. **Mejoras UI**
- Agregar animaciones de transición entre estados
- Implementar skeleton loaders más sofisticados
- Agregar filtros URL (query params) para compartir búsquedas

---

## 📖 Conclusión

La refactorización ha logrado:
1. ✅ **Separar la lógica de negocio** (backend en lambda)
2. ✅ **Modularizar el componente** (3 componentes nuevos)
3. ✅ **Crear utilidades reutilizables** (product-utils.ts)
4. ✅ **Custom hook para filtros** (useProductFilters.ts)
5. ✅ **Código más mantenible y testeable**

El componente ahora sigue los principios SOLID y es mucho más fácil de mantener, testear y extender.
