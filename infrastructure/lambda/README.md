# Lambda Functions - Full Vision

Este directorio contiene todas las funciones Lambda utilizadas en la infraestructura de Full Vision.

## 📁 Estructura

```
lambda/
├── pre-signup/           # Trigger: Pre sign-up de Cognito
├── post-confirmation/    # Trigger: Post confirmation de Cognito
├── image-processor/      # Procesamiento de imágenes S3
└── public-api/          # API pública para webhooks
```

## 🚀 Configuración de Node.js

Todas las funciones Lambda usan **Node.js 20.x** como runtime.

### Versiones disponibles de Node.js en AWS Lambda:

| Versión    | Runtime ID   | Estado        | Recomendación                         |
| ---------- | ------------ | ------------- | ------------------------------------- |
| Node.js 20 | `nodejs20.x` | ✅ Actual     | **Recomendado** para proyectos nuevos |
| Node.js 18 | `nodejs18.x` | ✅ LTS        | Soportado hasta abril 2025            |
| Node.js 16 | `nodejs16.x` | ⚠️ Deprecated | No usar en proyectos nuevos           |

### Configurar la versión de Node.js

En el archivo CDK (`lambda-functions-stack.ts`):

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X; // Node.js 20.x

const myFunction = new lambda.Function(this, "MyFunction", {
  runtime: nodeRuntime, // ← Aquí se configura la versión
  handler: "index.handler",
  code: lambda.Code.fromAsset("lambda/my-function"),
  // ... otras configuraciones
});
```

### Arquitecturas disponibles

Lambda soporta dos arquitecturas:

1. **x86_64** (Intel/AMD) - Por defecto
2. **ARM64** (Graviton2) - **20% más barato** y mejor rendimiento

```typescript
const myFunction = new lambda.Function(this, "MyFunction", {
  runtime: lambda.Runtime.NODEJS_20_X,
  architecture: lambda.Architecture.ARM_64, // ← ARM = más económico
  // ...
});
```

## 📦 Instalación de Dependencias

### Opción 1: Dependencias dentro de cada función

```bash
cd lambda/post-confirmation
npm install
cd ../..
```

CDK automáticamente empaquetará `node_modules` cuando uses:

```typescript
code: lambda.Code.fromAsset("lambda/post-confirmation");
```

### Opción 2: Lambda Layers (para dependencias compartidas)

Crea un layer para dependencias comunes:

```bash
# Estructura del layer
lambda-layers/
└── shared/
    └── nodejs/
        ├── node_modules/
        └── package.json
```

```bash
cd lambda-layers/shared/nodejs
npm install aws-sdk pg
cd ../../..
```

En CDK:

```typescript
const sharedLayer = new lambda.LayerVersion(this, "SharedLayer", {
  code: lambda.Code.fromAsset("lambda-layers/shared"),
  compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
});

const myFunction = new lambda.Function(this, "MyFunction", {
  layers: [sharedLayer],
  // ...
});
```

## 🔧 Configuración de Memoria y Timeout

### Memoria (afecta también el CPU)

- **128 MB** - Funciones muy simples
- **256 MB** - Validaciones, APIs básicas
- **512 MB** - APIs con DB, procesamiento ligero
- **1024 MB** - Procesamiento de imágenes, tareas complejas
- **10240 MB** - Máximo (10 GB)

```typescript
memorySize: 512, // MB
```

### Timeout

- **Mínimo**: 1 segundo
- **Máximo**: 900 segundos (15 minutos)
- **Recomendado**: Lo más bajo posible

```typescript
timeout: cdk.Duration.seconds(30),
```

## 🔑 Variables de Entorno

```typescript
environment: {
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  DATABASE_ENDPOINT: dbEndpoint,
  API_KEY: apiKey,
}
```

**Importante**: Para secretos sensibles usa **Secrets Manager** o **Parameter Store**, NO variables de entorno.

## 🔐 Permisos IAM

### Permisos básicos (automáticos)

- CloudWatch Logs: Siempre incluido

### Permisos adicionales

```typescript
myFunction.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ["s3:GetObject", "s3:PutObject"],
    resources: ["arn:aws:s3:::my-bucket/*"],
  })
);
```

### Conceder acceso a otros servicios

```typescript
// Permitir que S3 invoque la función
myFunction.addPermission("AllowS3Invoke", {
  principal: new iam.ServicePrincipal("s3.amazonaws.com"),
  sourceArn: bucket.bucketArn,
});
```

## 📊 Monitoreo y Logs

### CloudWatch Logs

Configurar retención:

```typescript
logRetention: logs.RetentionDays.ONE_WEEK,
```

### Métricas automáticas en CloudWatch:

- Invocations (invocaciones)
- Duration (duración)
- Errors (errores)
- Throttles (limitaciones)
- ConcurrentExecutions (ejecuciones concurrentes)

### Ver logs:

```bash
aws logs tail /aws/lambda/full-vision-pre-signup-dev --follow
```

## 🚦 Límites y Concurrencia

### Límites por defecto:

- **1000 ejecuciones concurrentes** por región
- **75 GB** de código total (incluyendo layers)
- **50 MB** de código por función (comprimido)
- **250 MB** de código por función (descomprimido)

### Configurar concurrencia reservada:

```typescript
reservedConcurrentExecutions: 10, // Máximo 10 ejecuciones simultáneas
```

## 🔄 Despliegue

### Desplegar todas las funciones:

```bash
cd infrastructure
npm run build
npm run deploy:dev
```

### Actualizar solo una función:

```bash
cdk deploy --exclusively LambdaFunctionsStack
```

### Probar localmente con SAM:

```bash
sam local invoke PreSignUpFunction -e events/pre-signup-event.json
```

## 📝 Testing

### Ejemplo de evento de prueba:

```json
{
  "version": "1",
  "region": "sa-east-1",
  "userPoolId": "sa-east-1_ABC123",
  "userName": "test-user",
  "request": {
    "userAttributes": {
      "email": "user@example.com",
      "given_name": "John",
      "family_name": "Doe"
    }
  },
  "response": {}
}
```

### Invocar desde AWS CLI:

```bash
aws lambda invoke \
  --function-name full-vision-pre-signup-dev \
  --payload file://events/pre-signup-event.json \
  output.json
```

## 🔗 Integrar con Cognito

En `full-vision-infrastructure-stack.ts`:

```typescript
import { LambdaFunctionsStack } from "./lambda-functions-stack";

// Crear el stack de Lambda
const lambdaStack = new LambdaFunctionsStack(app, "LambdaFunctions", {
  environment: "dev",
  userPool: this.userPool,
});

// Asociar triggers con Cognito
this.userPool = new cognito.UserPool(this, "UserPool", {
  // ... otras configuraciones
  lambdaTriggers: {
    preSignUp: lambdaStack.preSignUpFunction,
    postConfirmation: lambdaStack.postConfirmationFunction,
  },
});
```

## 💰 Optimización de Costos

1. **Usar ARM64** en lugar de x86_64 (20% más barato)
2. **Ajustar memoria** al mínimo necesario
3. **Reducir timeout** al mínimo necesario
4. **Usar Lambda Layers** para dependencias compartidas
5. **Provisioned Concurrency** solo si necesitas baja latencia constante
6. **Retención de logs** apropiada (no indefinida)

## 🐛 Debugging

### Ver logs en tiempo real:

```bash
aws logs tail /aws/lambda/full-vision-pre-signup-dev --follow --format short
```

### Ver métricas:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=full-vision-pre-signup-dev \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## 🔗 Referencias

- [AWS Lambda Node.js Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [CDK Lambda Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
