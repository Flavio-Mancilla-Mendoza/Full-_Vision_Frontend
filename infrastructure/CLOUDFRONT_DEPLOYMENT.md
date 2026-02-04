# CloudFront Integration - Deployment Guide

## 📋 Resumen de Cambios

Se ha configurado CloudFront para servir las imágenes de productos de forma más eficiente:

### ✅ Cambios Realizados en CDK Stack:

1. **Imports habilitados:**

   - Descomentado `aws-cloudfront` y `aws-cloudfront-origins`

2. **Origin Access Identity (OAI):**

   - Configurado para acceso seguro desde CloudFront a S3
   - El bucket de imágenes ahora solo es accesible vía CloudFront (no directamente)

3. **CloudFront Distribution:**

   - Configuración optimizada para imágenes de productos
   - Cache policy: `CACHING_OPTIMIZED`
   - Compresión habilitada
   - HTTPS obligatorio
   - Geo-restriction: América Latina y América del Norte

4. **Outputs actualizados:**
   - `CloudFrontDistributionId`: ID de la distribución
   - `CloudFrontURL`: URL pública de CloudFront para acceder a las imágenes

---

## 🚀 Pasos para Desplegar

### Paso 1: Verificar que el CDK Stack compile sin errores

```bash
cd infrastructure
npm run build
```

Si hay errores de TypeScript, revísalos antes de continuar.

### Paso 2: Desplegar el Stack actualizado

```bash
# Opción A: Deploy interactivo (recomendado la primera vez)
cdk deploy FullVisionInfrastructureStack-dev --profile default

# Opción B: Deploy automático (usa si estás seguro)
cdk deploy FullVisionInfrastructureStack-dev --profile default --require-approval never
```

**⏱️ Tiempo estimado:** 15-20 minutos (CloudFront tarda en propagarse globalmente)

### Paso 3: Capturar la URL de CloudFront

Después del deploy, copia la URL de CloudFront de los outputs:

```
Outputs:
FullVisionInfrastructureStack-dev.CloudFrontURL = https://d1234567890abc.cloudfront.net
```

### Paso 4: Actualizar variables de entorno

Actualiza tu archivo `.env` en la raíz del proyecto:

```bash
# Reemplaza la URL base de S3 con la de CloudFront
VITE_IMAGES_BASE_URL=https://d1234567890abc.cloudfront.net
```

**Nota:** NO cambies `VITE_AWS_S3_IMAGES_BUCKET` - el bucket name se usa para generar presigned URLs.

### Paso 5: Actualizar `infrastructure/.env.dev`

```bash
IMAGES_BASE_URL=https://d1234567890abc.cloudfront.net
```

### Paso 6: Probar la integración

1. **Subir una imagen de prueba:**

   ```bash
   # Desde la raíz del proyecto
   cd infrastructure
   aws s3 cp test-image.jpg s3://fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e/products/ --region sa-east-1
   ```

2. **Acceder vía CloudFront:**

   ```bash
   # URL de CloudFront
   https://d1234567890abc.cloudfront.net/products/test-image.jpg
   ```

3. **Verificar headers de respuesta:**
   - Debe tener `x-cache: Hit from cloudfront` o `Miss from cloudfront`
   - Debe redirigir a HTTPS automáticamente

---

## 📝 Modificaciones Pendientes en el Código

Después del deploy, necesitas actualizar el código frontend para usar CloudFront:

### Archivo: `src/services/imageStorage.ts`

Actualizar la función `getPublicUrl` para usar CloudFront en lugar de S3 directo:

```typescript
export const getPublicUrl = (s3Key: string): string => {
  if (!s3Key) return "";

  // Usar CloudFront en lugar de S3 directo
  const cloudFrontUrl = import.meta.env.VITE_IMAGES_BASE_URL;

  if (cloudFrontUrl) {
    // CloudFront URL
    return `${cloudFrontUrl}/${s3Key}`;
  }

  // Fallback a S3 directo (solo si CloudFront no está configurado)
  const bucketName = import.meta.env.VITE_AWS_S3_IMAGES_BUCKET;
  const region = import.meta.env.VITE_AWS_REGION || "sa-east-1";
  return `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
};
```

---

## 🔍 Verificación Post-Deployment

### 1. CloudFront está activo:

```bash
aws cloudfront get-distribution --id <DISTRIBUTION_ID> --query 'Distribution.Status'
```

Debe retornar: `"Deployed"`

### 2. Bucket de imágenes NO es público:

```bash
aws s3api get-bucket-policy-status --bucket fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e --region sa-east-1
```

Debe retornar que NO es público (solo CloudFront tiene acceso).

### 3. Caché de CloudFront funciona:

```bash
# Primera request (Miss from cloudfront)
curl -I https://d1234567890abc.cloudfront.net/products/test-image.jpg

# Segunda request (Hit from cloudfront)
curl -I https://d1234567890abc.cloudfront.net/products/test-image.jpg
```

### 4. Test en la aplicación:

- Abre el panel de administración
- Sube una imagen de producto
- Verifica que la imagen se cargue correctamente
- Inspecciona la URL de la imagen (debe ser de CloudFront, no S3)

---

## 🐛 Troubleshooting

### Error: "Access Denied" al acceder vía CloudFront

**Causa:** OAI no tiene permisos en el bucket.

**Solución:**

```bash
cd infrastructure
cdk deploy FullVisionInfrastructureStack-dev --force
```

### Error: Imágenes antiguas no cargan desde CloudFront

**Causa:** Las URLs en la base de datos todavía apuntan a S3 directo.

**Solución:** Ejecutar migración de URLs:

```sql
-- Actualizar URLs de S3 a CloudFront
UPDATE product_images
SET url = REPLACE(url,
  'https://fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e.s3.sa-east-1.amazonaws.com',
  'https://d1234567890abc.cloudfront.net'
);
```

### CloudFront tarda mucho en propagar cambios

**Causa:** CloudFront puede tardar hasta 15-20 minutos en propagar una nueva distribución.

**Solución:** Esperar o verificar el status:

```bash
aws cloudfront get-distribution --id <DISTRIBUTION_ID> --query 'Distribution.Status'
```

### Invalidar caché de CloudFront después de cambios

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

⚠️ **Nota:** Solo 1000 invalidaciones gratuitas por mes. Usa con moderación.

---

## 💰 Costos Estimados de CloudFront

### Tier Gratuito (12 meses):

- 1 TB de transferencia de datos salientes por mes
- 10,000,000 de requests HTTP/HTTPS
- 2,000,000 de invalidaciones

### Después del tier gratuito:

- ~$0.085 USD por GB de transferencia (Sudamérica)
- ~$0.0075 USD por 10,000 requests HTTP/HTTPS
- ~$0.005 USD por invalidación después de las primeras 1,000

**Estimado mensual para 100 productos con 5 imágenes cada uno:**

- Almacenamiento: ~2.5 GB
- Transferencia: ~50 GB/mes (con caché)
- Costo aproximado: **$5-10 USD/mes**

---

## ✅ Checklist Final

Antes de considerar la integración completa:

- [ ] CDK deploy exitoso
- [ ] CloudFront distribution status: "Deployed"
- [ ] Variables de entorno actualizadas (.env y .env.dev)
- [ ] Código frontend actualizado (imageStorage.ts)
- [ ] Test de subida de imagen exitoso
- [ ] Test de acceso vía CloudFront exitoso
- [ ] Verificación de headers de caché (x-cache)
- [ ] URLs en DB migradas (si necesario)
- [ ] Documentación actualizada

---

## 📚 Recursos Adicionales

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [Origin Access Identity](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Cache Policy Reference](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
