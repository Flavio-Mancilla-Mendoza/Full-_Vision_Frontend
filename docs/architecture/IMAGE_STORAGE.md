# 🖼️ Image Storage - Supabase Storage

## Arquitectura Actual

Full Vision utiliza **Supabase Storage** directamente para el almacenamiento y servicio de imágenes de productos.

### Stack

- **Storage**: Supabase Storage (bucket: `product-images`)
- **Acceso**: Bucket público con RLS para escritura/eliminación
- **URLs**: URLs públicas directas (no requieren firma)

## Archivos Principales

### 1. Servicio de Storage

**`src/services/imageStorage.ts`**

Funciones principales:

- `uploadProductImage(file, folder)` - Sube imagen al bucket
- `deleteProductImage(key)` - Elimina imagen del bucket
- `getPresignedUrl(key)` - Obtiene URL pública (no requiere firma)
- `extractKeyFromUrl(url)` - Extrae el path/key de una URL

### 2. Componentes de UI

**`src/components/admin/ImageUpload.tsx`**

- Componente para subir/gestionar imágenes en admin panel
- Soporte para múltiples imágenes
- Optimización automática de imágenes
- Drag & drop

**`src/components/common/S3Image.tsx`**

- Componente para mostrar imágenes desde Storage
- Manejo de estados de carga
- Fallback para errores

### 3. Tipos

**`src/types/database.ts`**

```typescript
product_images: {
  id: string;
  product_id: string;
  url: string; // URL pública de Supabase Storage
  s3_key: string | null; // Path en el bucket (e.g., "products/123.jpg")
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}
```

## Configuración del Bucket

El bucket `product-images` está configurado con:

1. **Acceso público para lectura**: Todos pueden ver las imágenes
2. **RLS para escritura**: Solo admins pueden subir/eliminar
3. **Políticas**:

   ```sql
   -- Lectura pública
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'product-images');

   -- Escritura solo para admins
   CREATE POLICY "Admin upload access"
   ON storage.objects FOR INSERT
   TO authenticated
   USING (
     bucket_id = 'product-images' AND
     auth.jwt() ->> 'role' = 'admin'
   );

   -- Eliminación solo para admins
   CREATE POLICY "Admin delete access"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'product-images' AND
     auth.jwt() ->> 'role' = 'admin'
   );
   ```

## Flujo de Subida de Imagen

1. Usuario selecciona imagen en admin panel
2. `ImageUpload.tsx` valida y optimiza la imagen
3. `uploadProductImage()` sube al bucket `product-images`
4. Se obtiene URL pública de Supabase Storage
5. Se guarda URL y key en tabla `product_images`

```typescript
// Ejemplo de uso
const result = await uploadProductImage(file, "products");
if (result.success) {
  console.log("URL:", result.url);
  console.log("Key:", result.key);
  // Guardar en BD: { url: result.url, s3_key: result.key }
}
```

## Ventajas vs AWS S3

✅ **Simplicidad**: No requiere Edge Functions ni presigned URLs  
✅ **Integración**: Mismo proyecto de Supabase, misma autenticación  
✅ **RLS Nativo**: Políticas de seguridad a nivel de bucket  
✅ **Sin configuración externa**: No requiere IAM, secrets, ni AWS  
✅ **Costos**: Incluido en plan de Supabase

## URLs de Ejemplo

```
https://txjryksczwwthbgmmjms.supabase.co/storage/v1/object/public/product-images/products/1234567890-abc123.jpg
```

Estructura:

- `txjryksczwwthbgmmjms.supabase.co` - Proyecto de Supabase
- `/storage/v1/object/public` - Endpoint público de Storage
- `/product-images` - Bucket name
- `/products/1234567890-abc123.jpg` - Key/path del archivo

## Limitaciones

- **Tamaño máximo**: 50MB por archivo (configurable)
- **Storage total**: Según plan de Supabase (1GB en Free tier)
- **CDN**: Supabase usa su propio CDN global

## Dashboard

Gestión del bucket: https://supabase.com/dashboard/project/txjryksczwwthbgmmjms/storage/buckets/product-images

## Migraciones Futuras

Si en el futuro se necesita migrar a AWS S3 o CloudFront:

1. El campo `s3_key` ya existe en la BD
2. Solo se necesitaría actualizar `imageStorage.ts`
3. Los componentes no requieren cambios
