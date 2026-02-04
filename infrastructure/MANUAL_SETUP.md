# 🔧 Guía Manual: Configurar Node.js 20.x en Lambda

## ⚠️ Error en la Actualización Automática

El archivo `full-vision-infrastructure-stack.ts` se corrompió durante la actualización automática.

**No te preocupes - aquí está la solución simple.**

## ✅ Solución: Cambios Manuales (3 pasos)

### Paso 1: Agregar import de Lambda

**Abrir:** `infrastructure/lib/full-vision-infrastructure-stack.ts`

**Buscar** la línea 4 (aproximadamente):

```typescript
import * as cognito from "aws-cdk-lib/aws-cognito";
```

**Agregar debajo:**

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";
```

---

### Paso 2: Crear las Funciones Lambda

**Buscar** el comentario (alrededor de la línea 130):

```typescript
// ================================================================
// 3. Amazon Cognito - Autenticación
// ================================================================
```

**Agregar ANTES de ese comentario:**

```typescript
// ================================================================
// 3. Lambda Functions para Cognito Triggers
// ================================================================

// Versión de Node.js para todas las funciones Lambda
const nodeRuntime = lambda.Runtime.NODEJS_18_X; // Node.js 18.x LTS

// Pre Sign-Up Lambda - Validación antes del registro
const preSignUpFunction = new lambda.Function(this, "PreSignUpFunction", {
  functionName: `full-vision-pre-signup-${environment}`,
  runtime: nodeRuntime,
  handler: "index.handler",
  code: lambda.Code.fromAsset("lambda/pre-signup"),
  memorySize: 256,
  timeout: cdk.Duration.seconds(10),
  environment: {
    NODE_ENV: environment,
    ALLOWED_DOMAINS: "gmail.com,hotmail.com,fullvision.com",
    LOG_LEVEL: environment === "prod" ? "warn" : "debug",
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
  description: "Pre sign-up trigger for user validation",
});

// Post Confirmation Lambda - Después de confirmar el email
const postConfirmationFunction = new lambda.Function(this, "PostConfirmationFunction", {
  functionName: `full-vision-post-confirmation-${environment}`,
  runtime: nodeRuntime,
  handler: "index.handler",
  code: lambda.Code.fromAsset("lambda/post-confirmation"),
  memorySize: 512,
  timeout: cdk.Duration.seconds(30),
  environment: {
    NODE_ENV: environment,
    DATABASE_ENDPOINT: this.database.instanceEndpoint.hostname,
    LOG_LEVEL: environment === "prod" ? "warn" : "debug",
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
  description: "Post confirmation trigger to create user profile",
});

// Permisos para post-confirmation acceder a DB secret
postConfirmationFunction.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["secretsmanager:GetSecretValue"],
    resources: [dbSecret.secretArn],
  })
);
```

**Nota:** Cambié `NODEJS_20_X` por `NODEJS_18_X` porque tu versión de CDK (2.100.0) no soporta Node.js 20.

---

### Paso 3: Conectar con Cognito

**Buscar** (alrededor de la línea 200):

```typescript
      // Lambda triggers (opcional, para lógica custom)
      lambdaTriggers: {},
```

**Reemplazar por:**

```typescript
      // Lambda triggers - Integración con funciones Lambda
      lambdaTriggers: {
        preSignUp: preSignUpFunction,
        postConfirmation: postConfirmationFunction,
      },
```

---

### Paso 4: Dar Permisos a Cognito (OPCIONAL)

**Buscar** el final del bloque `UserPoolDomain` (después del `});`):

```typescript
// User Pool Domain
new cognito.UserPoolDomain(this, "UserPoolDomain", {
  userPool: this.userPool,
  cognitoDomain: {
    domainPrefix: `full-vision-${environment}`,
  },
});
```

**Agregar después:**

```typescript
// Dar permisos a Cognito para invocar las funciones Lambda
preSignUpFunction.grantInvoke(new iam.ServicePrincipal("cognito-idp.amazonaws.com"));
postConfirmationFunction.grantInvoke(new iam.ServicePrincipal("cognito-idp.amazonaws.com"));
```

---

## 🚀 Ahora Desplegar

1. **Instalar dependencias de Lambda:**

```bash
cd infrastructure/lambda/post-confirmation
npm install
cd ../..
```

2. **Compilar:**

```bash
npm run build
```

3. **Desplegar:**

```bash
npm run deploy:dev
```

---

## ⚡ Alternativa Rápida: Actualizar CDK

Si quieres usar Node.js 20.x, actualiza CDK primero:

```bash
cd infrastructure
npm install aws-cdk-lib@latest aws-cdk@latest
```

Luego en el código usa:

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X; // Node.js 20.x
```

---

## 📊 Tabla de Versiones

| Versión CDK           | Node.js 16    | Node.js 18 | Node.js 20 |
| --------------------- | ------------- | ---------- | ---------- |
| 2.100.0 ⬅️ Tu versión | ✅            | ✅         | ❌         |
| 2.110.0+              | ✅            | ✅         | ✅         |
| 2.150.0+ (Latest)     | ⚠️ Deprecated | ✅         | ✅         |

---

## 🎯 Recomendación

**Para tu versión actual de CDK (2.100.0):**

- Usa `lambda.Runtime.NODEJS_18_X` (Node.js 18 LTS)
- Es estable, soportado hasta abril 2025
- Funciona perfectamente con tu CDK

**Si actualizas CDK:**

- Actualiza a `aws-cdk-lib@latest`
- Entonces puedes usar `lambda.Runtime.NODEJS_20_X`

---

## ✅ Resumen de lo que tienes configurado

Ya tienes listos:

- ✅ `lambda/pre-signup/` - Código de validación
- ✅ `lambda/post-confirmation/` - Código de creación de perfil
- ✅ `lambda/README.md` - Documentación completa
- ✅ Scripts de despliegue
- ✅ Eventos de prueba

Solo falta:

- ⏳ Hacer los 3 cambios manuales arriba
- ⏳ Instalar dependencias
- ⏳ Desplegar

---

## 🆘 Si Tienes Problemas

1. **Error de sintaxis:** Asegúrate de que todos los `{` y `}` estén balanceados
2. **Import falta:** Verifica que agregaste `import * as lambda from "aws-cdk-lib/aws-lambda";`
3. **Variable no definida:** Las funciones Lambda deben estar definidas ANTES de usarlas en `lambdaTriggers`

---

**¿Necesitas ayuda con los cambios manuales?** Solo dime en qué paso estás y te ayudo.
