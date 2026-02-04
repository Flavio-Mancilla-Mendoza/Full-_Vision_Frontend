# 🚀 Guía Rápida: Configuración de Lambda con Node.js

## ✅ Lo que acabo de configurar

1. **Versión de Node.js**: Node.js 20.x (`NODEJS_20_X`)
2. **Funciones Lambda creadas**:
   - `pre-signup`: Validación antes del registro en Cognito
   - `post-confirmation`: Crear perfil de usuario después de confirmar email
3. **Integración con Cognito**: Los triggers están configurados automáticamente
4. **Stack independiente**: `lambda-functions-stack.ts` para funciones adicionales

## 📦 Antes de Desplegar

### 1. Instalar dependencias de Lambda (si las necesitas)

```bash
# Para post-confirmation (necesita AWS SDK)
cd infrastructure/lambda/post-confirmation
npm install
cd ../../..
```

### 2. Compilar CDK

```bash
cd infrastructure
npm run build
```

### 3. Desplegar

```bash
npm run deploy:dev
```

## 🔧 Cambiar la Versión de Node.js

### En el Stack Principal (full-vision-infrastructure-stack.ts)

Busca esta línea:

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X; // Node.js 20.x
```

**Opciones disponibles:**

```typescript
// Node.js 20 (Recomendado)
const nodeRuntime = lambda.Runtime.NODEJS_20_X;

// Node.js 18 LTS
const nodeRuntime = lambda.Runtime.NODEJS_18_X;

// Node.js 16 (Deprecated - no usar)
const nodeRuntime = lambda.Runtime.NODEJS_16_X;
```

### En el Stack de Lambda Functions (lambda-functions-stack.ts)

Misma configuración - busca:

```typescript
const nodeRuntime = lambda.Runtime.NODEJS_20_X;
```

## 📝 Estructura de Archivos

```
infrastructure/
├── lib/
│   ├── full-vision-infrastructure-stack.ts  ← Stack principal (actualizado)
│   └── lambda-functions-stack.ts            ← Stack opcional para más funciones
└── lambda/
    ├── README.md                             ← Documentación completa
    ├── pre-signup/
    │   ├── index.js                          ← Código de la función
    │   └── package.json                      ← Node.js 20.x
    └── post-confirmation/
        ├── index.js                          ← Código de la función
        └── package.json                      ← Node.js 20.x + dependencias
```

## 🎯 Características Configuradas

### Pre-Signup Lambda

- ✅ Runtime: Node.js 20.x
- ✅ Memory: 256 MB
- ✅ Timeout: 10 segundos
- ✅ Logs: 7 días de retención
- ✅ Validación de email
- ✅ Auto-confirmación para dominios específicos

### Post-Confirmation Lambda

- ✅ Runtime: Node.js 20.x
- ✅ Memory: 512 MB
- ✅ Timeout: 30 segundos
- ✅ Logs: 7 días de retención
- ✅ Permisos para acceder a Secrets Manager
- ✅ Conexión a base de datos RDS

## 🔑 Configuración por Ambiente

Las funciones Lambda automáticamente reciben:

- `NODE_ENV`: 'dev' o 'prod'
- `LOG_LEVEL`: 'debug' en dev, 'warn' en prod
- `DATABASE_ENDPOINT`: Endpoint de tu RDS

## 🧪 Probar Localmente

### Usando AWS SAM

1. Instalar SAM CLI:

```bash
# Windows
winget install Amazon.SAM-CLI

# macOS
brew install aws-sam-cli
```

2. Probar función:

```bash
cd infrastructure
sam local invoke PreSignUpFunction -e ../lambda/pre-signup/test-event.json
```

### Crear evento de prueba

Crear `lambda/pre-signup/test-event.json`:

```json
{
  "version": "1",
  "triggerSource": "PreSignUp_SignUp",
  "region": "sa-east-1",
  "userPoolId": "sa-east-1_TEST",
  "userName": "testuser",
  "request": {
    "userAttributes": {
      "email": "test@gmail.com",
      "given_name": "Test",
      "family_name": "User"
    }
  },
  "response": {
    "autoConfirmUser": false,
    "autoVerifyEmail": false
  }
}
```

## 🔄 Actualizar una Función

1. Edita el código en `lambda/[function-name]/index.js`
2. Si agregaste dependencias: `cd lambda/[function-name] && npm install`
3. Despliega:

```bash
cd infrastructure
npm run build
npm run deploy:dev
```

CDK solo actualizará la función modificada.

## 📊 Ver Logs en Tiempo Real

```bash
# Pre-signup
aws logs tail /aws/lambda/full-vision-pre-signup-dev --follow

# Post-confirmation
aws logs tail /aws/lambda/full-vision-post-confirmation-dev --follow
```

## 🐛 Troubleshooting

### Error: "Runtime not supported"

- Asegúrate de que tu versión de CDK sea >= 2.100.0
- Node.js 20 requiere `aws-cdk-lib` >= 2.100.0

### Error: "Cannot find module"

```bash
cd lambda/post-confirmation
npm install
```

### Error: "Function timeout"

- Aumenta el timeout en la definición de la función
- Optimiza el código para reducir el tiempo de ejecución

### Error: "Permission denied"

- Verifica que los permisos IAM estén correctos
- Revisa CloudWatch Logs para ver el error específico

## 💰 Costos Estimados

**Lambda con Node.js 20.x:**

- Primeros 1M de requests: GRATIS
- Después: $0.20 por 1M requests
- Compute: $0.0000166667 por GB-segundo

**Ejemplo:** 10,000 requests/mes con 256MB y 1s de duración = **GRATIS**

## 🔗 Próximos Pasos

1. **Instalar dependencias** si es necesario:

   ```bash
   cd infrastructure/lambda/post-confirmation
   npm install
   ```

2. **Desplegar**:

   ```bash
   cd ..
   npm run build
   npm run deploy:dev
   ```

3. **Verificar** en AWS Console:

   - Lambda > Functions
   - Cognito > User Pools > Triggers

4. **Probar** registrando un nuevo usuario en tu app

## 📚 Documentación Completa

Revisa `infrastructure/lambda/README.md` para:

- Configuración avanzada
- Lambda Layers
- Optimización de costos
- Arquitectura ARM64
- Más ejemplos de funciones

## 🆘 Necesitas Ayuda?

1. Revisa los logs en CloudWatch
2. Verifica la documentación en `lambda/README.md`
3. Consulta [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
