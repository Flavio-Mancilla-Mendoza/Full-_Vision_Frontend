# Brands API - Configuración y Deploy

## 📋 Resumen

Se ha migrado la gestión de marcas desde Supabase directo a la arquitectura estándar usando:

- **API Gateway** (rutas públicas y protegidas)
- **Lambda** (supabase-proxy con validación de permisos)
- **Cognito** (autenticación JWT para creación de marcas)

## 🔄 Flujo de Creación de Marca

```
Frontend (ProductManagement.tsx)
    ↓
api.brands.create({ name: "Nike" })
    ↓
API Gateway (/brands POST con JWT)
    ↓
Cognito Authorizer (valida JWT)
    ↓
Lambda (supabase-proxy)
    ├─ Valida grupo "admins"
    ├─ Verifica duplicados
    └─ Inserta en Supabase con SERVICE_ROLE
    ↓
RDS/Supabase (tabla brands)
```

## 📁 Archivos Modificados

### 1. Infrastructure (CDK)

- `infrastructure/lib/api-gateway-stack.ts`
  - ✅ Agregado `/public/brands` GET (público)
  - ✅ Agregado `/public/brands/check-exists` POST (público)
  - ✅ Agregado `/brands` GET/POST (protegido, requiere Cognito)

### 2. Lambda Handler

- `packages/lambda-proxy/index.js`
  - ✅ Actualizado `handleBrands()` con:
    - GET: listado de marcas activas
    - POST: creación con validación de admin
    - POST check-exists: verificación de duplicados
  - ✅ Actualizado router para rutas públicas y protegidas

### 3. Frontend Services

- `src/services/api.ts`
  - ✅ Agregado `brandsApi` con métodos:
    - `getPublic()`: obtener marcas (público)
    - `create()`: crear marca (admin)
    - `checkExists()`: verificar existencia

- `src/services/brands.ts`
  - ✅ Migrado de Supabase directo a llamadas API Gateway
  - ✅ Removido `import { supabase }` (ya no necesario)

## 🚀 Pasos para Deploy

### 1. Instalar dependencias del Lambda

```bash
cd packages/lambda-proxy
npm install
cd ../../..
```

### 2. Deploy del Stack de API Gateway

```bash
cd infrastructure
npm run build
cdk deploy FullVisionApiStack --profile <tu-profile>
```

### 3. Verificar outputs

Después del deploy, verás:

```
Outputs:
FullVisionApiStack.ApiUrl = https://xxxxx.execute-api.sa-east-1.amazonaws.com/dev
```

### 4. Actualizar `.env` del frontend

```bash
# .env
VITE_API_GATEWAY_URL=https://xxxxx.execute-api.sa-east-1.amazonaws.com/dev
```

### 5. Rebuild frontend

```bash
npm run build
```

## 🧪 Pruebas

### Prueba 1: Obtener marcas (público)

```bash
curl https://tu-api-id.execute-api.sa-east-1.amazonaws.com/dev/public/brands
```

**Esperado**: Array de marcas activas

### Prueba 2: Verificar existencia (público)

```bash
curl -X POST https://tu-api-id.execute-api.sa-east-1.amazonaws.com/dev/public/brands/check-exists \
  -H "Content-Type: application/json" \
  -d '{"name":"Ray-Ban"}'
```

**Esperado**: `{"exists": true}` o `{"exists": false}`

### Prueba 3: Crear marca (requiere JWT de admin)

```bash
# Obtén tu JWT desde la consola del navegador (localStorage o sessionStorage)
# Busca: CognitoIdentityServiceProvider.<pool-id>.<user>.idToken

curl -X POST https://tu-api-id.execute-api.sa-east-1.amazonaws.com/dev/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-jwt-token>" \
  -d '{"name":"Nueva Marca","description":"Descripción opcional"}'
```

**Esperado (si eres admin)**:

```json
{
  "id": "uuid",
  "name": "Nueva Marca",
  "slug": "nueva-marca",
  "description": "Descripción opcional",
  "is_active": true,
  "created_at": "2026-01-09T..."
}
```

**Esperado (si NO eres admin)**:

```json
{
  "error": "Forbidden: Admin access required",
  "groups": ["users"]
}
```

## ✅ Validaciones Implementadas

1. **Autenticación**: Solo usuarios autenticados pueden crear marcas
2. **Autorización**: Solo usuarios en el grupo `admins` pueden crear
3. **Duplicados**: Verifica existencia antes de crear (case-insensitive)
4. **Generación automática**: Genera `slug` automáticamente si no se proporciona
5. **Estado por defecto**: Todas las marcas se crean con `is_active: true`

## 🐛 Troubleshooting

### Error: "Authentication required"

- **Causa**: No se envió el JWT o es inválido
- **Solución**: Verifica que el token esté en el header `Authorization: Bearer <token>`

### Error: "Forbidden: Admin access required"

- **Causa**: El usuario no está en el grupo `admins`
- **Solución**: Agrega el usuario al grupo admin en Cognito Console

### Error: "Brand with this name already exists"

- **Causa**: Ya existe una marca con ese nombre (case-insensitive)
- **Solución**: Usa otro nombre o edita la marca existente

### Error: "Missing Supabase configuration"

- **Causa**: Variables de entorno no configuradas en Lambda
- **Solución**: Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén en `.env`

## 📊 Logs y Monitoreo

### Ver logs del Lambda

```bash
aws logs tail /aws/lambda/full-vision-supabase-proxy-dev --follow --profile <tu-profile>
```

### Buscar errores de creación de marca

```bash
aws logs filter-pattern "Brand creation" \
  --log-group-name /aws/lambda/full-vision-supabase-proxy-dev \
  --profile <tu-profile>
```

## 🔐 Seguridad

- ✅ JWT validation en API Gateway (Cognito Authorizer)
- ✅ Group-based authorization en Lambda (solo admin)
- ✅ RLS bypass seguro con SERVICE_ROLE (solo desde Lambda)
- ✅ No se expone SERVICE_ROLE al frontend
- ✅ Rate limiting de API Gateway (por defecto)

## 📝 Notas Adicionales

- Las rutas públicas (`/public/brands`) NO requieren autenticación
- Las rutas protegidas (`/brands`) requieren JWT de Cognito
- El Lambda usa `SERVICE_ROLE` de Supabase para bypass de RLS
- Los grupos de Cognito se validan case-insensitive (`admin` o `admins`)
