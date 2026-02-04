# Buenas Prácticas para Prevenir Errores en React

## 🚨 Problema: Renderizado de Valores Falsy en React

### El Problema

En React, cuando se usa el operador `&&` para renderizado condicional, valores como `0`, `""` (string vacío), y `NaN` se renderizan como texto en lugar de no renderizarse.

```tsx
// ❌ INCORRECTO - Renderiza "0" si count es 0
{
  count && <Badge>{count}</Badge>;
}

// ❌ INCORRECTO - Renderiza "0" si discount_percentage es 0
{
  discount_percentage && <span>{discount_percentage}%</span>;
}

// ✅ CORRECTO - No renderiza nada si count es 0
{
  count > 0 && <Badge>{count}</Badge>;
}

// ✅ CORRECTO - Usa booleano explícito
{
  Boolean(count) && <Badge>{count}</Badge>;
}

// ✅ CORRECTO - Usa operador ternario
{
  count ? <Badge>{count}</Badge> : null;
}
```

## 🛡️ Soluciones Implementadas

### 1. Función Utilitaria Centralizada

**Ubicación:** `src/lib/utils.ts`

```typescript
/**
 * Normaliza valores numéricos para evitar renderizar 0 accidentalmente.
 * Convierte 0, null, undefined a null para uso seguro en componentes.
 */
export function normalizeNumericValue(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value === 0) {
    return null;
  }
  return value;
}

/**
 * Normaliza un producto para uso en componentes React.
 * Previene que valores como 0 en discount_percentage o sale_price causen renders incorrectos.
 */
export function normalizeProduct<
  T extends {
    discount_percentage?: number | null;
    sale_price?: number | null;
  }
>(product: T): T {
  return {
    ...product,
    discount_percentage: normalizeNumericValue(product.discount_percentage),
    sale_price: normalizeNumericValue(product.sale_price),
  };
}
```

### 2. Aplicación en Servicios

Todos los servicios que obtienen productos de la base de datos deben aplicar la normalización:

```typescript
// ✅ CORRECTO
import { normalizeProduct } from "@/lib/utils";

export async function getProducts() {
  const { data } = await supabase.from("products").select("*");

  // Normalizar productos antes de retornarlos
  return data.map(normalizeProduct);
}
```

**Servicios actualizados:**

- ✅ `src/services/productCategories.ts` - `getProductsByGender()`
- ✅ `src/services/featured.ts` - `getFeaturedProductsForHome()`
- ✅ `src/services/liquidacion.ts` - `getLiquidacionProducts()`
- ✅ `src/services/bestsellers.ts` - `transformToCarouselProduct()`

### 3. Validación en Componentes

Aunque normalizamos en los servicios, también validamos en los componentes:

```tsx
// ProductCard.tsx
const hasDiscount = (sale_price && sale_price > 0 && sale_price < base_price) || (discount_percentage && discount_percentage > 0);

// Solo mostrar badge si hay descuento real
{
  hasDiscount && <Badge>{Math.round(discountPercentage)}% OFF</Badge>;
}
```

## 📋 Checklist para Nuevos Componentes

Cuando crees un nuevo componente o servicio que maneje productos:

### En Servicios (src/services/\*.ts)

- [ ] Importar `normalizeProduct` de `@/lib/utils`
- [ ] Aplicar `normalizeProduct()` a todos los productos antes de retornarlos
- [ ] Verificar que `discount_percentage` y `sale_price` nunca sean `0` sino `null`

```typescript
// Ejemplo
import { normalizeProduct } from "@/lib/utils";

const transformedProducts = data.map(normalizeProduct);
return transformedProducts;
```

### En Componentes (src/components/\*.tsx)

- [ ] Nunca usar `{value && <Component />}` con valores numéricos
- [ ] Siempre usar comparaciones explícitas: `{value > 0 && <Component />}`
- [ ] Para badges de conteo: `{count > 0 && <Badge>{count}</Badge>}`
- [ ] Para descuentos: `{discount > 0 && <Badge>{discount}%</Badge>}`

### En Props de Componentes

- [ ] Definir props numéricas como opcionales y nullable: `discount_percentage?: number | null`
- [ ] Proporcionar valores por defecto seguros: `discount_percentage = null`
- [ ] Validar valores antes de usar: `if (discount_percentage && discount_percentage > 0)`

## 🔍 Patrones Comunes a Evitar

### ❌ Renders Condicionales Inseguros

```tsx
// MAL - Puede renderizar 0
{
  discount_percentage && <span>{discount_percentage}%</span>;
}
{
  count && <Badge>{count}</Badge>;
}
{
  value && <div>{value}</div>;
}

// BIEN - Comparación explícita
{
  discount_percentage > 0 && <span>{discount_percentage}%</span>;
}
{
  count > 0 && <Badge>{count}</Badge>;
}
{
  value !== null && value !== undefined && <div>{value}</div>;
}
```

### ❌ Transformaciones de Datos Inseguras

```tsx
// MAL - Puede pasar 0
discount_percentage: product.discount_percentage;

// BIEN - Convierte 0 a null
discount_percentage: product.discount_percentage || null;

// MEJOR - Usa función utilitaria
discount_percentage: normalizeNumericValue(product.discount_percentage);
```

### ❌ Props Sin Validación

```tsx
// MAL - Puede recibir 0 y renderizarlo
<Badge>{discount_percentage}% OFF</Badge>;

// BIEN - Valida antes de usar
{
  discount_percentage && discount_percentage > 0 && <Badge>{discount_percentage}% OFF</Badge>;
}
```

## 🧪 Testing

Para prevenir regresiones, considera agregar tests:

```typescript
import { normalizeProduct, normalizeNumericValue } from "@/lib/utils";

describe("normalizeNumericValue", () => {
  it("should convert 0 to null", () => {
    expect(normalizeNumericValue(0)).toBeNull();
  });

  it("should keep positive values", () => {
    expect(normalizeNumericValue(50)).toBe(50);
  });

  it("should convert null/undefined to null", () => {
    expect(normalizeNumericValue(null)).toBeNull();
    expect(normalizeNumericValue(undefined)).toBeNull();
  });
});

describe("normalizeProduct", () => {
  it("should normalize discount_percentage", () => {
    const product = { discount_percentage: 0, sale_price: 100 };
    const normalized = normalizeProduct(product);
    expect(normalized.discount_percentage).toBeNull();
  });
});
```

## 📚 Recursos Adicionales

- [React Docs - Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [TypeScript Handbook - Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## ✅ Resumen

1. **Siempre normaliza datos numéricos** que puedan ser 0 antes de pasarlos a componentes
2. **Usa comparaciones explícitas** en lugar de confiar en truthiness
3. **Aplica `normalizeProduct()`** en todos los servicios que retornan productos
4. **Valida props numéricas** antes de renderizarlas
5. **Revisa el checklist** antes de hacer commit de nuevos componentes

---

**Última actualización:** Diciembre 2025
**Mantenedor:** Equipo de Desarrollo Full Vision
