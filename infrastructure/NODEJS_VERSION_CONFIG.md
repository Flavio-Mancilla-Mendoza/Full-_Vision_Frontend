# ⚙️ Configuración de Node.js en Lambda - Full Vision

## 📊 Resumen de la Configuración

### ✅ Versión Configurada: Node.js 20.x

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X;
```

### 📍 Ubicaciones Actualizadas

1. **Stack Principal** → [infrastructure/lib/full-vision-infrastructure-stack.ts](infrastructure/lib/full-vision-infrastructure-stack.ts)

   - ✅ Pre-signup Lambda
   - ✅ Post-confirmation Lambda
   - ✅ Integración con Cognito

2. **Stack Independiente** → [infrastructure/lib/lambda-functions-stack.ts](infrastructure/lib/lambda-functions-stack.ts)

   - ✅ Ejemplos adicionales
   - ✅ Lambda con URL pública
   - ✅ Lambda para procesamiento de imágenes

3. **Código de Funciones** → [infrastructure/lambda/](infrastructure/lambda/)
   - ✅ `pre-signup/` - Validación de registro
   - ✅ `post-confirmation/` - Creación de perfil

---

## 🎯 Funciones Lambda Creadas

### 1. Pre-Signup Lambda

**Propósito:** Validar usuarios antes del registro en Cognito

| Configuración | Valor           |
| ------------- | --------------- |
| Runtime       | Node.js 20.x    |
| Memory        | 256 MB          |
| Timeout       | 10 segundos     |
| Handler       | `index.handler` |
| Logs          | 7 días          |

**Características:**

- ✅ Validación de email
- ✅ Validación de dominios permitidos
- ✅ Auto-confirmación para dominios corporativos
- ✅ Validación de nombre y apellido

### 2. Post-Confirmation Lambda

**Propósito:** Crear perfil de usuario después de confirmar email

| Configuración | Valor           |
| ------------- | --------------- |
| Runtime       | Node.js 20.x    |
| Memory        | 512 MB          |
| Timeout       | 30 segundos     |
| Handler       | `index.handler` |
| Logs          | 7 días          |

**Características:**

- ✅ Acceso a RDS PostgreSQL
- ✅ Permisos para Secrets Manager
- ✅ Creación de perfil en base de datos
- ✅ Variables de entorno configuradas

---

## 🔄 Comparación de Versiones de Node.js

| Versión        | Runtime ID    | Estado        | Soporte hasta | Recomendado |
| -------------- | ------------- | ------------- | ------------- | ----------- |
| **Node.js 20** | `NODEJS_20_X` | ✅ Current    | Abril 2026    | ⭐ **SÍ**   |
| Node.js 18     | `NODEJS_18_X` | ✅ LTS        | Abril 2025    | ✅ Sí       |
| Node.js 16     | `NODEJS_16_X` | ⚠️ Deprecated | Marzo 2024    | ❌ No       |

---

## 🚀 Cómo Desplegar

### Opción 1: Script Automático (Windows)

```bash
cd infrastructure
.\scripts\deploy-lambda.bat
```

### Opción 2: Script Automático (Linux/Mac)

```bash
cd infrastructure
chmod +x scripts/deploy-lambda.sh
./scripts/deploy-lambda.sh
```

### Opción 3: Manual

```bash
# 1. Instalar dependencias de Lambda
cd infrastructure/lambda/post-confirmation
npm install --production
cd ../..

# 2. Compilar CDK
npm run build

# 3. Desplegar
npm run deploy:dev
```

---

## 🔧 Cómo Cambiar la Versión de Node.js

### En el Stack Principal

Abre: [infrastructure/lib/full-vision-infrastructure-stack.ts](infrastructure/lib/full-vision-infrastructure-stack.ts)

Busca la línea ~35:

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X; // ← Cambiar aquí
```

**Opciones:**

```typescript
// Node.js 20 (Actual - Recomendado)
const nodeRuntime = lambda.Runtime.NODEJS_20_X;

// Node.js 18 LTS (Si prefieres más estabilidad)
const nodeRuntime = lambda.Runtime.NODEJS_18_X;
```

### En el Stack de Lambda Functions

Abre: [infrastructure/lib/lambda-functions-stack.ts](infrastructure/lib/lambda-functions-stack.ts)

Busca la línea ~26:

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X; // ← Cambiar aquí
```

**Después de cambiar, recompilar y redesplegar:**

```bash
cd infrastructure
npm run build
npm run deploy:dev
```

---

## 🧪 Probar las Funciones

### Probar Pre-Signup localmente con SAM

```bash
cd infrastructure
sam local invoke PreSignUpFunction -e lambda/pre-signup/test-event.json
```

### Probar Post-Confirmation localmente

```bash
sam local invoke PostConfirmationFunction -e lambda/post-confirmation/test-event.json
```

### Ver logs en AWS

```bash
# Pre-signup
aws logs tail /aws/lambda/full-vision-pre-signup-dev --follow

# Post-confirmation
aws logs tail /aws/lambda/full-vision-post-confirmation-dev --follow
```

---

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     COGNITO USER POOL                       │
│                                                             │
│  ┌──────────────┐                  ┌──────────────┐       │
│  │  Pre-Signup  │ → Node.js 20.x → │   Validation │       │
│  │   Trigger    │                  │   (256 MB)   │       │
│  └──────────────┘                  └──────────────┘       │
│                                                             │
│  ┌──────────────┐                  ┌──────────────┐       │
│  │     Post     │ → Node.js 20.x → │   Create     │       │
│  │ Confirmation │                  │   Profile    │       │
│  │   Trigger    │                  │   (512 MB)   │       │
│  └──────────────┘                  └──────────────┘       │
│                                            ↓               │
│                                     ┌──────────────┐       │
│                                     │ RDS Postgres │       │
│                                     └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Estructura de Archivos Creados/Actualizados

```
infrastructure/
├── LAMBDA_SETUP.md                          ← Guía rápida ⭐
├── lambda/
│   ├── README.md                            ← Documentación completa
│   ├── pre-signup/
│   │   ├── index.js                         ← Código Node.js 20
│   │   ├── package.json                     ← Engines: node >= 20
│   │   └── test-event.json                  ← Evento de prueba
│   └── post-confirmation/
│       ├── index.js                         ← Código Node.js 20
│       ├── package.json                     ← Engines: node >= 20
│       └── test-event.json                  ← Evento de prueba
├── lib/
│   ├── full-vision-infrastructure-stack.ts  ← ACTUALIZADO ✅
│   ├── lambda-functions-stack.ts            ← NUEVO ⭐
│   └── lambda-config-example.ts             ← Ejemplo config
└── scripts/
    ├── deploy-lambda.bat                    ← Script Windows
    └── deploy-lambda.sh                     ← Script Linux/Mac
```

---

## 💡 Mejores Prácticas Implementadas

✅ **Node.js 20.x** - Última versión estable
✅ **Timeouts apropiados** - 10s para validación, 30s para DB
✅ **Memoria optimizada** - 256MB y 512MB según uso
✅ **Logs** - Retención de 7 días en CloudWatch
✅ **Permisos mínimos** - Solo lo necesario (Secrets Manager, RDS)
✅ **Variables de entorno** - Configuración por ambiente
✅ **Arquitectura** - x86_64 (puedes cambiar a ARM64 para 20% ahorro)

---

## 🔐 Permisos Configurados

### Pre-Signup Lambda

- CloudWatch Logs (automático)
- Invocación desde Cognito

### Post-Confirmation Lambda

- CloudWatch Logs (automático)
- Invocación desde Cognito
- Secrets Manager: `GetSecretValue` (para credenciales DB)

---

## 💰 Estimación de Costos

**Con 10,000 usuarios nuevos por mes:**

- Pre-signup: 10,000 invocaciones × 1s × 256MB = **GRATIS** (capa gratuita)
- Post-confirmation: 10,000 invocaciones × 2s × 512MB = **GRATIS** (capa gratuita)

**Capa gratuita de Lambda:**

- 1M requests/mes gratis
- 400,000 GB-segundos/mes gratis

---

## 🆘 Solución de Problemas

### ❌ Error: "Runtime not supported"

**Causa:** CDK desactualizado
**Solución:**

```bash
cd infrastructure
npm install aws-cdk-lib@latest
npm run build
```

### ❌ Error: "Cannot find module '@aws-sdk/client-secrets-manager'"

**Causa:** Falta instalar dependencias
**Solución:**

```bash
cd infrastructure/lambda/post-confirmation
npm install
```

### ❌ Error: "Function timeout"

**Causa:** Función tarda más del timeout configurado
**Solución:** Aumentar timeout en la definición:

```typescript
timeout: cdk.Duration.seconds(60), // Aumentar de 30 a 60
```

---

## 📚 Documentación Adicional

- **Guía Completa:** [lambda/README.md](lambda/README.md)
- **Guía Rápida:** [LAMBDA_SETUP.md](LAMBDA_SETUP.md)
- **AWS Lambda Node.js:** https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html
- **CDK Lambda Construct:** https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html

---

## ✅ Checklist de Despliegue

- [ ] Instalar dependencias: `cd lambda/post-confirmation && npm install`
- [ ] Compilar CDK: `npm run build`
- [ ] Revisar configuración en `full-vision-infrastructure-stack.ts`
- [ ] Desplegar: `npm run deploy:dev`
- [ ] Verificar en AWS Console → Lambda
- [ ] Verificar en AWS Console → Cognito → Triggers
- [ ] Probar registrando un usuario nuevo
- [ ] Revisar logs en CloudWatch

---

**Fecha de configuración:** Enero 2026
**Versión de Node.js:** 20.x
**Estado:** ✅ Listo para desplegar
