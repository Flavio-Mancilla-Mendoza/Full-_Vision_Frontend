# 🔍 Análisis de Lambdas AWS - Full Vision

**Fecha:** 3 Feb 2026  
**Región:** sa-east-1 (São Paulo)  
**Ambiente:** Development (dev)

---

## 📊 RESUMEN EJECUTIVO

### Lambdas Desplegadas: 12 funciones

#### ✅ Lambdas Principales (Producción):

1. **full-vision-supabase-products-dev** - Backend productos (protegido)
2. **full-vision-supabase-public-dev** - API pública (sin auth)
3. **full-vision-supabase-uploads-dev** - Uploads S3
4. **full-vision-pre-signup-dev** - Cognito trigger
5. **full-vision-post-confirmation-dev** - Cognito trigger
6. **full-vision-admin-user-management-dev** - Gestión usuarios admin
7. **full-vision-image-processor-dev** - Procesamiento imágenes
8. **full-vision-public-api-dev** - API pública con Function URL

#### 🔧 Lambdas de Infraestructura (Auto-generadas por CDK):

9. **CustomVpcRestrictDefault** - Configuración VPC
10. **CustomS3AutoDeleteObject** - Limpieza S3 en destroy
11. **LogRetention** - Retención de logs
12. **full-vision-arm-example-dev** - Ejemplo ARM (puede eliminarse)

---

## 🎯 ESTADO GENERAL

| Aspecto                 | Estado         | Comentario                    |
| ----------------------- | -------------- | ----------------------------- |
| **Runtime**             | ✅ Excelente   | Node.js 20.x (última versión) |
| **Memoria**             | ✅ Adecuado    | 512 MB para principales       |
| **Timeout**             | ✅ Correcto    | 30 segundos                   |
| **Código**              | ✅ Ligero      | ~1.4-2.1 KB (comprimido)      |
| **Última modificación** | ✅ Reciente    | 23 Enero 2026                 |
| **API Gateway**         | ✅ Activo      | full-vision-api-dev           |
| **Integración Cognito** | ✅ Configurado | Triggers activos              |

---

## 📋 DETALLE DE LAMBDAS PRINCIPALES

### 1. **full-vision-supabase-products-dev** 🛍️

**Propósito:** Backend principal para productos, órdenes, appointments, brands

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Memoria:** 512 MB ✅
- **Timeout:** 30 segundos ✅
- **Tamaño código:** 2,142 bytes (2.1 KB)
- **Handler:** index.handler
- **Última modificación:** 23 Enero 2026

**Código fuente:** `packages/lambda-proxy-products/`

**Handlers modulares:**

```javascript
packages/lambda-proxy-products/
├── index.js                    # Entry point
└── shared/                     # Lógica compartida
    ├── products.js
    ├── orders.js
    ├── appointments.js
    └── brands.js
```

**Rutas que maneja:**

- `POST /products` - Crear producto (admin)
- `GET /products` - Listar productos (protegido)
- `PUT /products/:id` - Actualizar producto
- `DELETE /products/:id` - Eliminar producto
- `GET /orders` - Listar órdenes
- `POST /orders` - Crear orden
- `GET /appointments` - Listar citas
- `POST /appointments` - Crear cita
- `GET /brands` - Listar marcas (protegido)
- `POST /brands` - Crear marca

**Variables de entorno:**

```
NODE_ENV=dev
SUPABASE_URL=***
SUPABASE_SERVICE_ROLE_KEY=***
LOG_LEVEL=debug
MERCADOPAGO_ACCESS_TOKEN=***
FRONTEND_URL=***
API_GATEWAY_URL=***
IMAGES_BUCKET_NAME=***
S3_REGION=sa-east-1
```

**Estado:** ✅ **ÓPTIMO** - Bien modularizado

---

### 2. **full-vision-supabase-public-dev** 🌐

**Propósito:** Endpoints públicos sin autenticación

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Memoria:** 512 MB ✅
- **Timeout:** 30 segundos ✅
- **Tamaño código:** 1,436 bytes (1.4 KB)
- **Última modificación:** 23 Enero 2026

**Código fuente:** `packages/lambda-proxy-public/`

**Rutas que maneja:**

- `GET /public/products` - Productos públicos
- `GET /public/products/:id` - Producto por ID
- `GET /public/bestsellers` - Productos destacados
- `GET /public/liquidacion` - Ofertas
- `GET /public/brands` - Marcas públicas
- `GET /public/site-content` - Contenido del sitio

**Estado:** ✅ **ÓPTIMO** - Separación correcta de responsabilidades

---

### 3. **full-vision-supabase-uploads-dev** 📤

**Propósito:** Generar presigned URLs para uploads a S3

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Memoria:** 512 MB ✅
- **Timeout:** 30 segundos ✅
- **Tamaño código:** 1,623 bytes (1.6 KB)
- **Última modificación:** 23 Enero 2026

**Código fuente:** `packages/lambda-proxy-uploads/`

**Rutas que maneja:**

- `POST /uploads/generate-url` - Generar URL para upload
- `POST /products/upload-url` - URL específica para productos

**Permisos S3:**

- `s3:PutObject` en bucket de imágenes
- `s3:GetObject` para validaciones

**Estado:** ✅ **ÓPTIMO** - Seguro con presigned URLs

---

### 4. **full-vision-pre-signup-dev** 🔐

**Propósito:** Trigger de Cognito - Validación pre-registro

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Timeout:** Configurado para triggers
- **Trigger:** Pre Sign-Up

**Código fuente:** `infrastructure/lambda/pre-signup/`

**Validaciones:**

- Email válido
- Formato de datos
- Prevención de duplicados

**Estado:** ✅ **ACTIVO**

---

### 5. **full-vision-post-confirmation-dev** ✉️

**Propósito:** Trigger de Cognito - Crear perfil en Supabase después de confirmar email

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Trigger:** Post Confirmation

**Código fuente:** `infrastructure/lambda/post-confirmation/`

**Acciones:**

- Crear registro en tabla `profiles` de Supabase
- Sincronizar datos de Cognito con Supabase
- Asignar rol default (customer)

**Variables de entorno:**

```
SUPABASE_URL=***
SUPABASE_SERVICE_ROLE_KEY=***
```

**Estado:** ✅ **ACTIVO** - Crítico para onboarding

---

### 6. **full-vision-admin-user-management-dev** 👨‍💼

**Propósito:** Operaciones administrativas de usuarios

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Memoria:** 256 MB
- **Timeout:** 30 segundos

**Código fuente:** `infrastructure/lambda/admin-user-management/`

**Operaciones:**

- `AdminCreateUser` - Crear usuario admin
- `AdminSetUserPassword` - Resetear password
- `AdminGetUser` - Obtener info de usuario
- `ListUsers` - Listar usuarios

**Permisos Cognito:**

- `cognito-idp:AdminCreateUser`
- `cognito-idp:AdminSetUserPassword`
- `cognito-idp:AdminGetUser`
- `cognito-idp:ListUsers`

**Estado:** ✅ **FUNCIONAL**

---

### 7. **full-vision-image-processor-dev** 🖼️

**Propósito:** Procesar y optimizar imágenes cargadas

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Memoria:** 1024 MB ⚠️ (alto para procesamiento)
- **Timeout:** 60 segundos
- **Ephemeral Storage:** 1024 MB

**Código fuente:** `infrastructure/lambda/image-processor/`

**Procesos:**

- Resize de imágenes
- Generación de thumbnails
- Conversión a WebP
- Optimización

**Variables de entorno:**

```
THUMBNAIL_SIZE=200x200
OUTPUT_FORMAT=webp
```

**Permisos S3:**

- `s3:GetObject` (read original)
- `s3:PutObject` (write optimized)

**Estado:** ✅ **CONFIGURADO** - Memoria adecuada para imagen processing

---

### 8. **full-vision-public-api-dev** 🔗

**Propósito:** API pública con Lambda Function URL (webhooks)

**Configuración:**

- **Runtime:** Node.js 20.x ✅
- **Memoria:** 512 MB
- **Timeout:** 15 segundos
- **Auth Type:** NONE (público)

**Código fuente:** `infrastructure/lambda/public-api/`

**Características:**

- Lambda Function URL (no requiere API Gateway)
- CORS configurado
- Sin autenticación
- Para webhooks externos (ej: MercadoPago)

**Estado:** ✅ **ACTIVO**

---

## 🔍 API GATEWAY

### full-vision-api-dev

**ID:** slrrvl1zs2  
**Creado:** 3 Enero 2026  
**Stage:** dev  
**Región:** sa-east-1

**URL Base:**

```
https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev
```

**Configuración:**

- ✅ CORS habilitado
- ✅ CloudWatch Logs activo
- ✅ Métricas habilitadas
- ✅ Tracing activo
- ✅ Cognito Authorizer configurado

**Rutas públicas (sin auth):**

```
GET  /public/products
GET  /public/products/{id}
GET  /public/bestsellers
GET  /public/liquidacion
GET  /public/brands
POST /public/brands/check-exists
GET  /public/categories
GET  /public/site-content
```

**Rutas protegidas (requieren Cognito JWT):**

```
# Productos
GET    /products
POST   /products
PUT    /products/{id}
DELETE /products/{id}

# Órdenes
GET    /orders
POST   /orders
GET    /orders/{id}
PUT    /orders/{id}

# Citas
GET    /appointments
POST   /appointments
PUT    /appointments/{id}

# Marcas
GET    /brands
POST   /brands

# Uploads
POST   /uploads/generate-url
POST   /products/upload-url

# Admin
POST   /admin/users/create
```

---

## ⚠️ PROBLEMAS Y RECOMENDACIONES

### 🟡 Problemas Menores

#### 1. Lambda de ejemplo innecesaria

**Lambda:** `full-vision-arm-example-dev`

- **Problema:** Es solo un ejemplo de ARM architecture
- **Impacto:** Ocupa espacio y puede causar confusión
- **Acción:** **ELIMINAR** en próximo deploy

**Cómo eliminar:**

```typescript
// En infrastructure/lib/lambda-functions-stack.ts
// Comentar o eliminar líneas 101-116 (ARMFunctionExample)
```

#### 2. Logs sin límite de retención

**Problema:** Algunos logs pueden acumular costos

- **Acción:** Verificar que todos tengan `logRetention: logs.RetentionDays.ONE_WEEK`

#### 3. CORS muy permisivo en development

**Configuración actual:**

```typescript
allowOrigins: apigateway.Cors.ALL_ORIGINS; // "*"
```

- **Problema:** Permite cualquier origen
- **Acción en producción:** Cambiar a dominios específicos

```typescript
allowOrigins: ["https://fullvision.com", "https://www.fullvision.com"];
```

---

### 🟢 Buenas Prácticas Implementadas

✅ **Node.js 20.x** - Runtime más reciente  
✅ **Memoria adecuada** - 512 MB para APIs, 1024 MB para procesamiento  
✅ **Timeouts razonables** - 30s para APIs, 60s para procesamiento  
✅ **Código modularizado** - Handlers separados por dominio  
✅ **Variables de entorno** - Configuración externalizada  
✅ **Logs estructurados** - CloudWatch configurado  
✅ **Permisos IAM específicos** - Mínimo privilegio  
✅ **Separación de responsabilidades** - Public vs Protected lambdas

---

## 📈 MÉTRICAS Y MONITOREO

### CloudWatch Logs

Grupos de logs activos:

```
/aws/lambda/full-vision-supabase-products-dev
/aws/lambda/full-vision-supabase-public-dev
/aws/lambda/full-vision-supabase-uploads-dev
/aws/lambda/full-vision-pre-signup-dev
/aws/lambda/full-vision-post-confirmation-dev
/aws/lambda/full-vision-admin-user-management-dev
/aws/lambda/full-vision-image-processor-dev
/aws/lambda/full-vision-public-api-dev
```

**Retención:** 7 días ✅

### Métricas recomendadas a monitorear

```bash
# Invocaciones
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=full-vision-supabase-products-dev \
  --start-time 2026-01-27T00:00:00 \
  --end-time 2026-02-03T23:59:59 \
  --period 86400 \
  --statistics Sum \
  --region sa-east-1

# Errores
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=full-vision-supabase-products-dev \
  --start-time 2026-01-27T00:00:00 \
  --end-time 2026-02-03T23:59:59 \
  --period 86400 \
  --statistics Sum \
  --region sa-east-1

# Duración
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=full-vision-supabase-products-dev \
  --start-time 2026-01-27T00:00:00 \
  --end-time 2026-02-03T23:59:59 \
  --period 3600 \
  --statistics Average,Maximum \
  --region sa-east-1
```

---

## 🔧 OPTIMIZACIONES SUGERIDAS

### 1. Implementar Lambda Layers para dependencias comunes

**Beneficio:** Reducir tamaño de código y tiempo de deploy

```typescript
// Ya tienes el layer definido en lambda-functions-stack.ts
const sharedLayer = new lambda.LayerVersion(this, "SharedDependenciesLayer", {
  code: lambda.Code.fromAsset("lambda-layers/shared"),
  compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
});

// Aplicar a tus lambdas:
this.supabaseProductsFunction.addLayers(sharedLayer);
this.supabasePublicFunction.addLayers(sharedLayer);
this.supabaseUploadsFunction.addLayers(sharedLayer);
```

**Dependencias para el layer:**

- `@supabase/supabase-js`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

### 2. Configurar Reserved Concurrency

**Para lambdas críticas:**

```typescript
this.supabaseProductsFunction.addAlias("live", {
  description: "Alias for production traffic",
  provisionedConcurrentExecutions: 2, // Mantener 2 instancias warm
});
```

**Beneficio:** Reducir cold starts

### 3. Habilitar X-Ray Tracing completo

**Ya configurado en API Gateway, falta en algunas Lambdas:**

```typescript
this.supabaseProductsFunction = new lambda.Function(this, "...", {
  // ... config existente
  tracing: lambda.Tracing.ACTIVE, // ← Añadir esto
});
```

**Beneficio:** Debug distribuido end-to-end

### 4. Implementar Circuit Breaker para Supabase

**En código de Lambda:**

```javascript
// packages/lambda-proxy-products/shared/circuit-breaker.js
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.nextAttempt = Date.now();
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN");
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

### 5. Configurar Dead Letter Queue (DLQ)

```typescript
const dlQueue = new sqs.Queue(this, "LambdaDLQ", {
  queueName: `full-vision-lambda-dlq-${environment}`,
  retentionPeriod: cdk.Duration.days(14),
});

this.supabaseProductsFunction.addDeadLetterQueue({
  queue: dlQueue,
  maxReceiveCount: 2,
});
```

**Beneficio:** No perder eventos fallidos

---

## 💰 COSTOS ESTIMADOS

### Configuración actual (Dev):

**Lambdas principales (3):**

- Memoria: 512 MB
- Invocaciones estimadas: ~1,000/día
- Duración promedio: ~500ms

**Cálculo mensual (30 días):**

```
Invocaciones: 30,000 (dentro de free tier de 1M)
GB-segundos: 30,000 × 0.5s × 0.5GB = 7,500 GB-s
Costo: 7,500 × $0.0000166667 = $0.125 ≈ $0.13/mes
```

**API Gateway:**

```
Requests: 30,000/mes
Costo: 30,000 × $0.00000335 = $0.10/mes
```

**Total estimado dev:** ~$0.25/mes (casi gratis) ✅

### En producción (estimado 10x tráfico):

**Lambdas:**

- Invocaciones: 300,000/mes
- Costo: ~$1.30/mes

**API Gateway:**

- Requests: 300,000/mes
- Costo: ~$1.00/mes

**Total estimado prod:** ~$2.30/mes ✅

**Muy económico para serverless!**

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Inmediato (Esta semana):

1. ✅ **Eliminar Lambda de ejemplo**

   ```bash
   # Comentar full-vision-arm-example-dev en CDK
   # Redeploy
   ```

2. ✅ **Verificar logs de errores**

   ```bash
   aws logs tail /aws/lambda/full-vision-supabase-products-dev --since 1h --follow
   ```

3. ✅ **Documentar endpoints**
   - Ya tienes buena estructura
   - Añadir comentarios JSDoc en handlers

### Corto plazo (Próximas 2 semanas):

4. ⚠️ **Implementar Lambda Layers**
   - Crear layer con dependencias comunes
   - Aplicar a todas las lambdas
   - Reducir tamaño de deployment

5. ⚠️ **Configurar alertas CloudWatch**
   - Error rate > 5%
   - Duration > 25s (timeout warning)
   - Throttles > 0

6. ⚠️ **Testing de carga**
   - Verificar límites de concurrency
   - Ajustar memoria si necesario

### Medio plazo (Próximo mes):

7. 🔄 **Implementar CI/CD para Lambdas**
   - GitHub Actions
   - Deploy automático en merge a main
   - Tests antes de deploy

8. 🔄 **Migrar a producción**
   - Crear stack de prod
   - Configurar CORS específico
   - Dominio custom para API Gateway

---

## ✅ CONCLUSIÓN

### Estado general: **EXCELENTE** ✨

Tu infraestructura Lambda está:

✅ **Bien modularizada** - Separación clara de responsabilidades  
✅ **Actualizada** - Node.js 20.x  
✅ **Optimizada** - Memoria y timeouts adecuados  
✅ **Segura** - Permisos IAM correctos  
✅ **Económica** - Costos muy bajos  
✅ **Monitoreada** - CloudWatch configurado  
✅ **Escalable** - Arquitectura serverless

### Solo necesitas:

- 🗑️ Eliminar Lambda de ejemplo (opcional)
- 📊 Configurar alertas
- 🚀 Preparar para producción

**¡Gran trabajo con la modularización!** 🎉
