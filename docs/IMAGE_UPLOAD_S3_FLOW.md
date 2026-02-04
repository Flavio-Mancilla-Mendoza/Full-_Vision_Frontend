# 📸 Flujo de Subida de Imágenes a AWS S3

## 🎯 Arquitectura Migrada

**ANTES (Supabase Storage):**

```
Frontend → Supabase Storage → product_images table
```

**AHORA (AWS S3):**

```
Frontend → API Gateway → Lambda (presigned URL) → S3 → product_images table
```

---

## 🔄 Flujo Completo de Subida

### 1️⃣ **Frontend solicita presigned URL**

```typescript
// src/services/admin.ts - uploadProductImage()
const response = await fetch(`${API_GATEWAY_URL}/products/upload-url`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <JWT_TOKEN>"
  },
  body: JSON.stringify({
    fileName: "product.jpg",
    contentType: "image/jpeg"
  })
});

// Response:
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/...?presigned-params",
  "s3Key": "products/1234567890-abc123.jpg",
  "fileName": "product.jpg"
}
```

### 2️⃣ **Lambda genera presigned URL**

```javascript
// packages/lambda-proxy/index.js
// POST /products/upload-url

async function generatePresignedUploadUrl(fileName, contentType) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = fileName.split(".").pop();
  const s3Key = `products/${timestamp}-${randomString}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: IMAGES_BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
  });

  // URL válida por 15 minutos
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return { uploadUrl, s3Key, fileName };
}
```

**✅ Validaciones:**

- Usuario autenticado (JWT)
- Grupo `admin` requerido
- `fileName` y `contentType` obligatorios

### 3️⃣ **Frontend sube archivo directamente a S3**

```typescript
const uploadResponse = await fetch(uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": file.type,
  },
  body: file, // Archivo binario
});
```

**✅ Ventajas:**

- ✨ Subida directa (no pasa por Lambda)
- 🚀 Más rápido y eficiente
- 💰 Reduce costos de Lambda
- 🔒 Seguro (presigned URL temporal)

### 4️⃣ **Frontend guarda registro en BD**

```typescript
// Construir URL pública
const bucket = process.env.VITE_AWS_S3_IMAGES_BUCKET;
const region = process.env.VITE_AWS_REGION;
const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

// Guardar en product_images table
await createProductImageRecord(productId, {
  url: publicUrl,
  s3_key: s3Key, // ⭐ Guardamos s3Key para futuras operaciones
  alt_text: "Product image",
  sort_order: 0,
  is_primary: true,
});
```

---

## 🗂️ Esquema de Base de Datos

### Tabla `product_images`

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,              -- URL pública de S3
  s3_key TEXT,                    -- Key en S3 (ej: products/1234-abc.jpg)
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Campos importantes:**

- `url`: URL pública de S3 (o Supabase para legacy)
- `s3_key`: Key única en S3 para operaciones futuras (eliminar, actualizar)

---

## 📦 Variables de Entorno Requeridas

### Frontend (`.env`)

```bash
# AWS S3
VITE_AWS_S3_IMAGES_BUCKET=fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e
VITE_AWS_REGION=sa-east-1

# API Gateway
VITE_API_GATEWAY_URL=https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev
```

### Lambda (CDK Stack)

```typescript
IMAGES_BUCKET_NAME: imagesBucket.bucketName,
S3_REGION: 'sa-east-1',
SUPABASE_URL: config.supabase.url,
SUPABASE_SERVICE_ROLE_KEY: config.supabase.serviceRoleKey,
```

---

## 🔐 Permisos IAM Requeridos

### Lambda Role debe tener:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::BUCKET_NAME/products/*"
    }
  ]
}
```

### Bucket S3 CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:8080", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 🧪 Cómo Probar

### 1. Verificar endpoint de presigned URL

```bash
curl -X POST https://API_GATEWAY_URL/dev/products/upload-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileName": "test.jpg",
    "contentType": "image/jpeg"
  }'
```

**Respuesta esperada:**

```json
{
  "uploadUrl": "https://BUCKET.s3.REGION.amazonaws.com/products/...?X-Amz-...",
  "s3Key": "products/1736087654321-abc123.jpg",
  "fileName": "test.jpg"
}
```

### 2. Subir archivo con presigned URL

```bash
curl -X PUT "PRESIGNED_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg
```

### 3. Verificar en S3

- Ir a AWS Console → S3 → Bucket → `products/`
- Verificar que el archivo existe
- URL pública: `https://BUCKET.s3.REGION.amazonaws.com/products/1736087654321-abc123.jpg`

---

## 🐛 Troubleshooting

### Error: "Authentication required"

- ✅ Verifica que el token JWT esté en el header `Authorization`
- ✅ Token debe ser válido y no expirado
- ✅ Usuario debe estar en grupo `admin`

### Error: "IMAGES_BUCKET_NAME not configured"

- ✅ Verifica variables de entorno en Lambda
- ✅ Redeploy Lambda stack: `cd infrastructure && cdk deploy ApiGatewayStack-dev`

### Error: "Failed to upload to S3: 403"

- ✅ Verifica permisos IAM del Lambda role
- ✅ Verifica CORS del bucket S3
- ✅ Presigned URL expiró (solo válida 15 min)

### Imágenes no se muestran en frontend

- ✅ Verifica que `s3_key` se guardó en `product_images` table
- ✅ Lambda debe generar presigned URLs de lectura con `generatePresignedUrl(s3_key)`
- ✅ Bucket S3 debe ser público o usar presigned URLs para lectura

---

## 📊 Comparación con Sistema Anterior

| Feature       | Supabase Storage   | AWS S3 (Actual)           |
| ------------- | ------------------ | ------------------------- |
| Subida        | Cliente → Supabase | Cliente → S3 (presigned)  |
| Velocidad     | Moderada           | Rápida (directo a S3)     |
| Costos Lambda | N/A                | Mínimos (solo genera URL) |
| Seguridad     | RLS policies       | IAM + presigned URLs      |
| Escalabilidad | Limitada           | Ilimitada                 |
| CDN           | Supabase CDN       | CloudFront (futuro)       |
| URLs          | Públicas           | Públicas o presigned      |

---

## 🚀 Próximos Pasos

### 1. **CloudFront CDN** (Recomendado)

- Distribuir contenido globalmente
- Cache de imágenes
- Menor latencia

### 2. **Image Optimization Lambda**

- Redimensionar automáticamente
- Convertir a WebP
- Generar thumbnails

### 3. **Eliminar Imágenes de S3**

- Implementar endpoint `DELETE /products/images/{id}`
- Lambda elimina archivo de S3 y registro de BD

### 4. **Migrar imágenes legacy**

- Script para copiar de Supabase Storage a S3
- Actualizar registros con `s3_key`

---

## 📝 Notas Importantes

⚠️ **Presigned URLs expiran:**

- Upload: 15 minutos
- Download: 1 hora

⚠️ **Compatibilidad Legacy:**

- Sistema soporta ambas URLs (S3 y Supabase)
- Migración gradual sin downtime

⚠️ **Backup:**

- Configurar S3 Lifecycle Rules
- Versioning habilitado en bucket

---

## ✅ Checklist de Migración

- [x] Lambda genera presigned URLs
- [x] Frontend usa nuevo flujo de subida
- [x] Tabla `product_images` tiene campo `s3_key`
- [x] Lambda procesa imágenes con `s3_key`
- [ ] Deploy Lambda changes a AWS
- [ ] Probar subida de imagen desde admin
- [ ] Verificar productos muestran imágenes
- [ ] Configurar CloudFront (opcional)
- [ ] Migrar imágenes legacy (futuro)
