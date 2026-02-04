# Guía de Optimización de Imágenes - Full Vision

## ✅ Mejoras ya implementadas (sin configuración adicional)

Tu proyecto YA tiene estas optimizaciones activas:

### 1. Componente OptimizedImage

- ✅ Lazy loading con IntersectionObserver
- ✅ Blur placeholder mientras carga
- ✅ `decoding="async"` para no bloquear rendering
- ✅ Width/height explícitos (previene CLS)
- ✅ Transiciones suaves
- ✅ Manejo de errores

### 2. ProductCard optimizado

- ✅ `srcSet` para responsive (0.5x, 1x, 1.5x, 2x)
- ✅ `sizes` adaptativo según viewport
- ✅ Priority loading para primeras 3 imágenes
- ✅ Lazy loading para el resto

### 3. CloudFront CDN

- ✅ URLs servidas desde CloudFront: `https://dmnfd6b4vz00z.cloudfront.net`
- ✅ Cache global distribuido
- ✅ Menor latencia

## 🚀 Opciones para habilitar transformaciones (OPCIONAL)

Actualmente las imágenes se sirven desde CloudFront pero **sin transformación on-the-fly**.
Puedes agregar transformaciones con estas opciones:

---

## Opción 1: Lambda@Edge (Recomendado - Incluido)

**Ventajas:**

- ✅ Redimensiona on-the-fly (`?w=400&q=85`)
- ✅ Convierte a WebP automáticamente
- ✅ Cache en edge locations
- ✅ Infraestructura ya creada en este proyecto

**Costo:** ~$0.60 por millón de requests

### Deployment

```bash
# 1. Instalar dependencias de Lambda
cd infrastructure/lambda/image-optimization
npm install

# 2. Deploy (DEBE ser en sa-east-1)
cd ../..
npx cdk deploy ImageOptimizationStack --region sa-east-1

# 3. El output te dará el ARN de la función
# Copia el EdgeFunctionArn

# 4. Asociar a CloudFront (manual o CDK)
# Ve a CloudFront Console → Behaviors → Edit → Lambda@Edge
# Agrega: Origin Response → [ARN copiado]

# 5. Habilitar en frontend
# En src/hooks/use-image-optimization.ts línea ~70:
# Descomentar: return `${baseUrl}?${params.toString()}`;
```

---

## Opción 2: Pre-generar tamaños (Más simple)

**Ventajas:**

- ✅ Sin costos de Lambda
- ✅ Sin configuración de CloudFront
- ✅ Más rápido (imágenes ya transformadas)

**Desventajas:**

- ❌ Más espacio en S3
- ❌ Debes generar al subir

### Implementación

Cuando subes una imagen al S3, genera 4 versiones:

```typescript
// En tu API de upload
import sharp from "sharp";

async function uploadProductImage(file: Buffer, productId: string) {
  const sizes = [
    { name: "thumbnail", width: 200 },
    { name: "small", width: 400 },
    { name: "medium", width: 800 },
    { name: "large", width: 1200 },
  ];

  for (const size of sizes) {
    const resized = await sharp(file).resize(size.width, null, { fit: "inside" }).webp({ quality: 85 }).toBuffer();

    await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: `products/${productId}-${size.name}.webp`,
        Body: resized,
      })
      .promise();
  }
}
```

Luego en frontend:

```typescript
// Actualizar generateOptimizedUrl en use-image-optimization.ts
export const generateOptimizedUrl = (src: string, width?: number) => {
  const sizeVariant = width <= 200 ? "thumbnail" : width <= 400 ? "small" : width <= 800 ? "medium" : "large";

  return src.replace(".jpg", `-${sizeVariant}.webp`);
};
```

---

## Opción 3: Servicio externo (Más fácil pero costoso)

### Cloudinary (Recomendado si no quieres gestionar)

```bash
npm install cloudinary
```

```typescript
// src/lib/cloudinary.ts
import { Cloudinary } from "cloudinary-core";

const cl = new Cloudinary({
  cloud_name: "tu-cloud-name",
  secure: true,
});

export const getOptimizedUrl = (publicId: string, width: number) => {
  return cl.url(publicId, {
    width,
    crop: "scale",
    quality: "auto",
    fetch_format: "auto", // auto WebP
  });
};
```

**Costo:** Desde $0/mes (25GB, 25k transformaciones) hasta planes pagos.

---

## Opción 4: Imgix (Alternativa premium)

```bash
npm install @imgix/js-core
```

```typescript
import ImgixClient from "@imgix/js-core";

const client = new ImgixClient({
  domain: "tu-dominio.imgix.net",
  secureURLToken: "tu-token",
});

const url = client.buildURL("image.jpg", {
  w: 400,
  auto: "format,compress",
});
```

**Costo:** Desde $0/mes (1k requests) hasta planes enterprise.

---

## 📊 Comparación

| Opción      | Setup      | Costo Mensual\* | Latencia | Formato Auto |
| ----------- | ---------- | --------------- | -------- | ------------ |
| Lambda@Edge | Medio      | $0.60/1M        | Bajo     | ✅ WebP      |
| Pre-generar | Simple     | $0              | Muy bajo | ⚠️ Manual    |
| Cloudinary  | Muy simple | $0-89+          | Bajo     | ✅ Auto      |
| Imgix       | Muy simple | $0-199+         | Muy bajo | ✅ Auto      |

\*Para ~100k imágenes/mes

---

## 🎯 Recomendación

**Para Full Vision (ecommerce mediano):**

1. **Corto plazo (ahora):** Las optimizaciones ya implementadas son suficientes
2. **Mediano plazo (1-3 meses):** Lambda@Edge (infraestructura incluida)
3. **Largo plazo (6+ meses):** Si creces mucho, evaluar Cloudinary/Imgix

---

## 🧪 Probar cambios actuales

```bash
# Levantar proyecto
pnpm dev

# Abrir DevTools → Network → Img
# Verificar:
# - Loading: lazy (excepto primeras 3)
# - Decoding: async
# - Tamaño descargado vs renderizado
```

---

## 📈 Métricas esperadas

Con las optimizaciones actuales (sin Lambda@Edge):

- **LCP:** < 2.5s (imágenes above-the-fold eager)
- **CLS:** < 0.1 (width/height explícitos)
- **Lazy loading:** Solo cargan imágenes visibles
- **Bandwidth:** Mismo que antes (sin resize)

Con Lambda@Edge:

- **Bandwidth:** ↓ 50-70% (imágenes redimensionadas)
- **LCP:** ↓ 20-30% (imágenes más pequeñas)
- **Score Lighthouse:** +5-15 puntos

---

## ❓ FAQ

**P: ¿Necesito Lambda@Edge ahora?**
R: No. Las mejoras actuales ya dan gran beneficio. Lambda@Edge es opcional para reducir bandwidth.

**P: ¿Puedo usar solo CloudFront sin Lambda?**
R: Sí, es lo que tienes ahora. CloudFront sirve las imágenes rápido pero sin transformar.

**P: ¿Qué pasa si no configuro nada más?**
R: El proyecto funciona perfectamente. Ya tienes lazy loading, blur placeholder, y CDN.
