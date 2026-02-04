# Estrategia de Imágenes - Full Vision Database

## Problema: ¿Cómo manejar imágenes de productos con múltiples relaciones?

### Escenario: Ray-Ban

Al subir imágenes de lentes Ray-Ban necesitas datos para:

- 📦 **products** (el producto específico)
- 🏷️ **categories** (lentes de sol)
- 🏢 **brands** (Ray-Ban)
- 🖼️ **product_images** (múltiples fotos del producto)

## ✅ Estrategia Recomendada: "Una imagen, múltiples referencias"

### 1. Estructura de Storage

```
supabase-storage/
├── product-images/
│   ├── brands/
│   │   ├── rayban-logo.jpg
│   │   ├── oakley-logo.jpg
│   │   └── prada-logo.jpg
│   ├── categories/
│   │   ├── sunglasses-hero.jpg
│   │   ├── prescription-hero.jpg
│   │   └── kids-hero.jpg
│   └── products/
│       ├── rayban-aviator-001/
│       │   ├── main.jpg
│       │   ├── side.jpg
│       │   ├── back.jpg
│       │   └── lifestyle.jpg
│       └── rayban-wayfarer-002/
│           ├── main.jpg
│           └── variant-black.jpg
```

### 2. Base de Datos - Relaciones Inteligentes

#### Tabla: brands

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT, -- UNA sola imagen de logo
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Ejemplo:
INSERT INTO brands (name, logo_url) VALUES
('Ray-Ban', 'product-images/brands/rayban-logo.jpg');
```

#### Tabla: categories

```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  hero_image_url TEXT, -- UNA imagen hero por categoría
  icon_url TEXT, -- Icono pequeño
  description TEXT
);

-- Ejemplo:
INSERT INTO product_categories (name, hero_image_url) VALUES
('Lentes de Sol', 'product-images/categories/sunglasses-hero.jpg');
```

#### Tabla: products (referencia a brand y category)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand_id UUID REFERENCES brands(id), -- RELACIÓN, no duplicar logo
  category_id UUID REFERENCES product_categories(id), -- RELACIÓN
  main_image_url TEXT, -- Imagen principal del producto
  price DECIMAL(10,2),
  description TEXT
);

-- Ejemplo:
INSERT INTO products (name, brand_id, category_id, main_image_url) VALUES
('Aviator Classic', brand_rayban_id, sunglasses_category_id, 'product-images/products/rayban-aviator-001/main.jpg');
```

#### Tabla: product_images (múltiples fotos por producto)

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  image_type VARCHAR(20) -- 'main', 'gallery', 'lifestyle', 'variant'
);

-- Ejemplo:
INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES
(rayban_aviator_id, 'product-images/products/rayban-aviator-001/main.jpg', 'main', 1),
(rayban_aviator_id, 'product-images/products/rayban-aviator-001/side.jpg', 'gallery', 2),
(rayban_aviator_id, 'product-images/products/rayban-aviator-001/lifestyle.jpg', 'lifestyle', 3);
```

## 🔍 Consultas para Filtros del Home

### Obtener productos con todas sus imágenes y relaciones:

```sql
SELECT
  p.id,
  p.name as product_name,
  p.price,
  p.main_image_url,
  b.name as brand_name,
  b.logo_url as brand_logo,
  c.name as category_name,
  c.hero_image_url as category_hero,
  array_agg(
    json_build_object(
      'url', pi.image_url,
      'type', pi.image_type,
      'alt', pi.alt_text
    ) ORDER BY pi.sort_order
  ) as gallery_images
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = true
GROUP BY p.id, b.id, c.id;
```

### Filtros para el Home:

```sql
-- Por marca
SELECT * FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE b.name = 'Ray-Ban';

-- Por categoría
SELECT * FROM products p
JOIN product_categories c ON p.category_id = c.id
WHERE c.name = 'Lentes de Sol';

-- Búsqueda combinada
SELECT * FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN product_categories c ON p.category_id = c.id
WHERE b.name ILIKE '%ray%'
  AND c.name = 'Lentes de Sol'
  AND p.price BETWEEN 100 AND 500;
```

## 🎨 Implementación en React

### Service para productos con imágenes:

```typescript
// src/services/products.ts
export interface ProductWithImages {
  id: string;
  name: string;
  price: number;
  main_image_url: string;
  brand: {
    name: string;
    logo_url: string;
  };
  category: {
    name: string;
    hero_image_url: string;
  };
  gallery_images: Array<{
    url: string;
    type: string;
    alt: string;
  }>;
}

export async function getProductsWithFilters(filters: { brand?: string; category?: string; priceRange?: [number, number] }) {
  let query = supabase
    .from("products")
    .select(
      `
      *,
      brands:brand_id(name, logo_url),
      categories:category_id(name, hero_image_url),
      product_images(image_url, image_type, alt_text, sort_order)
    `
    )
    .eq("is_active", true);

  if (filters.brand) {
    query = query.eq("brands.name", filters.brand);
  }

  if (filters.category) {
    query = query.eq("categories.name", filters.category);
  }

  if (filters.priceRange) {
    query = query.gte("price", filters.priceRange[0]).lte("price", filters.priceRange[1]);
  }

  return query;
}
```

### Hook para filtros:

```typescript
// src/hooks/useProductFilters.ts
export function useProductFilters() {
  const [filters, setFilters] = useState({
    brand: "",
    category: "",
    priceRange: [0, 1000] as [number, number],
  });

  const { data: products, loading } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProductsWithFilters(filters),
  });

  const updateBrand = (brand: string) => setFilters((prev) => ({ ...prev, brand }));

  const updateCategory = (category: string) => setFilters((prev) => ({ ...prev, category }));

  return {
    products,
    loading,
    filters,
    updateBrand,
    updateCategory,
    setFilters,
  };
}
```

## 📋 Flujo Completo: Ray-Ban Aviator

### 1. Admin sube imágenes:

```
1. Crear/seleccionar marca: Ray-Ban
2. Crear/seleccionar categoría: Lentes de Sol
3. Subir imágenes del producto: aviator-main.jpg, aviator-side.jpg
4. Crear producto: referencia brand_id y category_id
5. Asociar imágenes: múltiples entradas en product_images
```

### 2. Usuario filtra en Home:

```
1. Click en "Ray-Ban" → filtra por brand_id
2. Click en "Lentes de Sol" → filtra por category_id
3. Combinaciones → múltiples filtros
4. Query optimizada → una sola consulta con JOINs
```

## ✅ Ventajas de este enfoque:

1. **Sin duplicación**: Una imagen, múltiples referencias
2. **Relaciones claras**: Foreign keys mantienen integridad
3. **Consultas eficientes**: JOINs optimizados
4. **Escalable**: Fácil agregar filtros
5. **Mantenible**: Cambios centralizados

## 🚀 Próximos pasos:

1. Actualizar tu schema actual
2. Migrar datos existentes
3. Crear services para filtros
4. Implementar UI de filtros en Home

¿Te ayudo a implementar esta estructura en tu proyecto actual?
