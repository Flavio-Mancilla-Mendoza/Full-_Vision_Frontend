# Backend Architecture - Full Vision React

## Resumen de la Arquitectura

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticación**: JWT con Supabase Auth
- **Base de Datos**: PostgreSQL con Row Level Security (RLS)
- **Almacenamiento**: Supabase Storage para imágenes
- **Hosting**: Netlify/Vercel (frontend) + Supabase (backend)

## Base de Datos y Seguridad

### Estructura Principal

```
├── users (auth.users - tabla de Supabase)
├── products (productos del catálogo)
├── appointments (citas médicas)
├── locations (ubicaciones/sucursales)
├── featured_products (productos destacados)
├── site_content (NUEVO - contenido dinámico del sitio)
└── Storage buckets (imágenes y archivos)
```

### Row Level Security (RLS)

**Concepto**: Las políticas RLS controlan quién puede ver/modificar qué datos a nivel de fila.

#### Políticas Implementadas:

1. **users**: Solo administradores pueden ver todos los usuarios
2. **products**: Lectura pública, escritura solo admins
3. **appointments**: Los usuarios solo ven sus propias citas
4. **site_content**: Lectura pública, escritura solo admins

### Roles y Permisos

```typescript
// Roles definidos en auth.users.raw_user_meta_data
{
  role: 'admin' | 'customer',
  full_name: string,
  // otros metadatos...
}
```

## Sistema de Gestión de Contenido Dinámico

### ¿Por qué lo necesitábamos?

Tu pregunta sobre "manejar algunas imágenes en el home" como la foto del hero llevó a crear un sistema completo de gestión de contenido dinámico.

### Arquitectura del Sistema

#### 1. Base de Datos (`site_content`)

```sql
CREATE TABLE site_content (
  id UUID PRIMARY KEY,
  section VARCHAR(50), -- 'hero', 'banner', 'about'
  content_type VARCHAR(20), -- 'image', 'text', 'video'
  key VARCHAR(100), -- 'hero_image', 'hero_title'
  value TEXT, -- URL o contenido
  alt_text TEXT, -- Para accesibilidad
  metadata JSONB, -- Datos adicionales
  is_active BOOLEAN,
  sort_order INTEGER
);
```

#### 2. Service Layer (`src/services/siteContent.ts`)

```typescript
// Funciones principales:
- getSiteContentBySection(section): Obtener contenido por sección
- createSiteContent(content): Crear nuevo contenido
- updateSiteContent(id, updates): Actualizar contenido
- deleteSiteContent(id): Eliminar contenido
- uploadSiteImage(file, path): Subir imagen a Storage
- useSiteContent(section): Hook de React para uso en componentes
```

#### 3. Admin Interface (`src/components/admin/SiteContentManagement.tsx`)

- **Pestañas organizadas**: Hero, Banner, About, etc.
- **Upload de imágenes**: Directo a Supabase Storage
- **Edición en tiempo real**: Cambios se reflejan inmediatamente
- **Preview**: Vista previa del contenido antes de activar

#### 4. Frontend Integration (`src/components/Hero.tsx`)

```typescript
// Uso del hook para contenido dinámico
const { heroContent, loading } = useSiteContent("hero");

// Extracción de datos con fallbacks
const heroImage = heroContent?.hero_background?.value || fallbackImage;
const heroTitle = heroContent?.hero_title?.value || fallbackTitle;
```

## Flujo de Datos Completo

### 1. Gestión de Contenido (Admin)

```
Admin Dashboard → Content Tab → Upload/Edit → Supabase Storage + DB → RLS Check → Save
```

### 2. Visualización (Usuario)

```
Hero Component → useSiteContent hook → Supabase Query → RLS Check → Display
```

### 3. Autenticación

```
Login → Supabase Auth → JWT Token → RLS Policies → Access Control
```

## Optimizaciones Implementadas

### Performance

1. **Lazy Loading**: Componentes admin se cargan bajo demanda
2. **Image Optimization**: Compresión y múltiples tamaños
3. **Caching**: React Query para cache automático
4. **Suspense**: Loading states elegantes

### Seguridad

1. **RLS Policies**: Control granular de acceso
2. **JWT Validation**: Tokens seguros
3. **File Upload Limits**: Restricciones de tamaño/tipo
4. **Input Sanitization**: Prevención de XSS

## Casos de Uso del Sistema de Contenido

### Gestión de Imágenes del Hero

```typescript
// Cambiar imagen de fondo del hero
await updateSiteContent(heroImageId, {
  value: newImageUrl,
  alt_text: "Nueva imagen de hero",
  metadata: { width: 2070, height: 750 },
});
```

### Promociones y Banners

```typescript
// Crear nuevo banner promocional
await createSiteContent({
  section: "banner",
  content_type: "image",
  key: "summer_promo",
  value: imageUrl,
  metadata: { start_date: "2024-06-01", end_date: "2024-08-31" },
});
```

### Textos Dinámicos

```typescript
// Actualizar título del hero
await updateSiteContent(heroTitleId, {
  value: "Nueva Temporada - Lentes de Sol 2024",
});
```

## Ventajas del Sistema

### Para Admins

- **No requiere código**: Cambios desde dashboard
- **Tiempo real**: Cambios inmediatos en el sitio
- **Organizado**: Contenido separado por secciones
- **Flexible**: Soporta imágenes, texto, metadata

### Para Desarrolladores

- **Escalable**: Fácil agregar nuevas secciones
- **Type-safe**: TypeScript completo
- **Testeable**: Funciones puras, fácil testing
- **Mantenible**: Separación clara de responsabilidades

### Para el Negocio

- **Agilidad**: Cambios rápidos sin deploys
- **Consistencia**: Template unificado
- **SEO**: Metadatos optimizados
- **A/B Testing**: Fácil probar variaciones

## Próximos Pasos Sugeridos

1. **Ejecutar Schema**: Aplicar `site-content-management.sql` en Supabase
2. **Testing**: Probar upload de imágenes y cambios en tiempo real
3. **Extensiones**: Agregar más secciones (productos destacados, testimonios)
4. **Analytics**: Tracking de cambios y performance
5. **Backup**: Sistema de respaldo del contenido

## Comando para Aplicar el Schema

```sql
-- Ejecutar en Supabase SQL Editor
\i database/site-content-management.sql
```

Este sistema te da control total sobre el contenido visual del sitio sin necesidad de hacer cambios en el código o nuevos deploys. ¡Perfecto para manejar esas imágenes del home que mencionaste!
