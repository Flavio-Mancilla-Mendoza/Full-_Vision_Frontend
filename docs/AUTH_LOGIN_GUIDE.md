# 🔐 Guía de Autenticación - AWS Cognito

## 📋 Resumen

**Tu app ya NO usa Supabase Auth**. Ahora usa **AWS Cognito** para autenticación.

### Arquitectura Actual:

```
LOGIN → AWS Cognito (autenticación)
         ↓
     JWT Token
         ↓
    API Gateway
         ↓
    Lambda Proxy
         ↓
    Supabase (solo datos con SERVICE_ROLE)
```

## ✅ Configuración Verificada

### Variables de Entorno (.env):

```bash
VITE_AWS_REGION=sa-east-1
VITE_AWS_COGNITO_USER_POOL_ID=sa-east-1_A4YLB61FR
VITE_AWS_COGNITO_CLIENT_ID=4fg5p06k3hma0s80ok8kova9m9
```

### Configuración de Amplify:

- **Archivo**: `src/lib/amplify-setup.ts`
- **Se inicializa en**: `src/main.tsx` (antes de renderizar la app)
- **Formato**: Amplify v6 con Auth.Cognito

## 🚀 Cómo Crear Usuarios

### Opción 1: Desde la Aplicación (Recomendado)

1. **Ir a la página de login**: http://localhost:8080/login
2. **Hacer clic en "Registrarse"**
3. **Llenar el formulario**:
   - Email válido
   - Contraseña con:
     - Mínimo 8 caracteres
     - Al menos 1 mayúscula
     - Al menos 1 minúscula
     - Al menos 1 número
     - Al menos 1 carácter especial (!@#$%^&\*)
   - Nombre completo
4. **Recibirás un código por email**
5. **Ingresar el código de 6 dígitos**
6. **¡Listo! Ya puedes hacer login**

### Opción 2: Desde AWS Console (Admin)

1. **Ir a AWS Cognito**: https://sa-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools
2. **Seleccionar User Pool**: `sa-east-1_A4YLB61FR`
3. **Users → Create user**
4. **Configurar**:
   - Email: `usuario@ejemplo.com`
   - Send email invitation: ✓
   - Mark email as verified: ✓
   - Temporary password: (genera una automática o crea una)
5. **Opcional - Hacer usuario admin**:
   - Ir a "Groups" tab
   - Seleccionar grupo "admin"
   - Add user to group

### Opción 3: Desde AWS CLI

```bash
# Crear usuario
aws cognito-idp admin-create-user \
  --user-pool-id sa-east-1_A4YLB61FR \
  --username usuario@ejemplo.com \
  --user-attributes Name=email,Value=usuario@ejemplo.com Name=email_verified,Value=true \
  --temporary-password "TempPassword123!" \
  --message-action SUPPRESS \
  --region sa-east-1 \
  --profile default

# Agregar a grupo admin (opcional)
aws cognito-idp admin-add-user-to-group \
  --user-pool-id sa-east-1_A4YLB61FR \
  --username usuario@ejemplo.com \
  --group-name admin \
  --region sa-east-1 \
  --profile default

# Confirmar usuario (si no confirmó por email)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id sa-east-1_A4YLB61FR \
  --username usuario@ejemplo.com \
  --region sa-east-1 \
  --profile default
```

## 🔧 Solución de Problemas

### Error: "AuthUserPoolException not configured"

**Causa**: Amplify no se inicializó correctamente.

**Solución**:

1. Verificar que las variables de entorno estén en `.env`
2. Reiniciar el servidor de desarrollo:
   ```bash
   # Detener servidor (Ctrl+C)
   npm run dev
   ```
3. Limpiar cache del navegador (Ctrl+Shift+Delete)
4. Verificar en consola del navegador que aparezca:
   ```
   ✅ [amplify-setup] Amplify v6 configurado exitosamente
   ```

### Error: "User does not exist"

**Causa**: El usuario no está creado en Cognito.

**Solución**: Crear el usuario usando una de las 3 opciones arriba.

### Error: "User is not confirmed"

**Causa**: El usuario no confirmó su email.

**Solución**:

1. Buscar el email con el código de verificación
2. Si no llegó, hacer clic en "Reenviar código" en la app
3. O desde AWS CLI:
   ```bash
   aws cognito-idp admin-confirm-sign-up \
     --user-pool-id sa-east-1_A4YLB61FR \
     --username usuario@ejemplo.com \
     --region sa-east-1 \
     --profile default
   ```

### Error: "Incorrect username or password"

**Causa**: Credenciales incorrectas.

**Solución**:

1. Verificar email (es case-sensitive en algunos casos)
2. Verificar contraseña
3. Si es primera vez con usuario creado desde consola, usar la contraseña temporal que se envió por email
4. Resetear contraseña desde la app (botón "¿Olvidaste tu contraseña?")

### Error: "Password does not conform to policy"

**Causa**: La contraseña no cumple requisitos de Cognito.

**Requisitos**:

- Mínimo 8 caracteres
- Al menos 1 letra mayúscula (A-Z)
- Al menos 1 letra minúscula (a-z)
- Al menos 1 número (0-9)
- Al menos 1 carácter especial (!@#$%^&\*)

**Ejemplo de contraseña válida**: `MiPassword123!`

## 👤 Usuarios de Prueba

### Usuario Admin (si ya existe):

```
Email: flavio_mancillamendoza@outlook.es
Grupo: admin
```

### Crear Usuario Regular:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id sa-east-1_A4YLB61FR \
  --username test@ejemplo.com \
  --user-attributes Name=email,Value=test@ejemplo.com Name=email_verified,Value=true \
  --temporary-password "TestUser123!" \
  --region sa-east-1 \
  --profile default
```

## 🧪 Testing del Login

### 1. Verificar Configuración

Abrir consola del navegador (F12) al cargar la app:

```javascript
// Debería aparecer:
🚀 [amplify-setup] Configurando Amplify v6...
Region: sa-east-1
UserPool: sa-east-1_A4YLB61FR
ClientID: 4fg5p06k3hma0s80ok8kova9m9
✅ [amplify-setup] Amplify v6 configurado exitosamente
```

### 2. Test de Login

```javascript
// En la consola del navegador
import { signIn } from "@aws-amplify/auth";

const result = await signIn({
  username: "tu@email.com",
  password: "TuPassword123!",
});

console.log("Login result:", result);
```

### 3. Verificar Token JWT

```javascript
import { fetchAuthSession } from "@aws-amplify/auth";

const session = await fetchAuthSession();
console.log("Token:", session.tokens?.idToken?.toString());
console.log("Groups:", session.tokens?.accessToken?.payload["cognito:groups"]);
```

## 📚 Flujo Completo

### Registro Nuevo Usuario:

1. Usuario llena formulario de registro
2. Cognito envía código por email
3. Usuario ingresa código
4. Cuenta confirmada
5. Usuario hace login
6. Obtiene JWT token
7. Token se usa para API Gateway
8. Lambda valida permisos
9. Acceso a datos en Supabase

### Login Usuario Existente:

1. Usuario ingresa email y contraseña
2. Cognito valida credenciales
3. Genera JWT token
4. Frontend guarda token
5. Todas las requests a API Gateway incluyen token
6. Lambda extrae info del usuario del token
7. Ejecuta queries en Supabase con SERVICE_ROLE

## 🔑 Grupos de Cognito

### admin

- Acceso completo a todos los recursos
- Puede crear/editar/eliminar productos
- Puede ver todas las órdenes
- Acceso al dashboard admin

### user (por defecto)

- Acceso limitado a sus propios datos
- Puede ver productos
- Puede crear órdenes
- Solo ve sus propias órdenes

## 🆘 Soporte

Si sigues teniendo problemas:

1. **Verificar logs en consola del navegador**
2. **Verificar CloudWatch Logs del Lambda**: `/aws/lambda/full-vision-supabase-proxy-dev`
3. **Verificar que el User Pool existe en AWS Cognito**
4. **Reiniciar servidor de desarrollo**
5. **Limpiar localStorage del navegador**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## ✨ Próximos Pasos Después del Login

Una vez que puedas hacer login:

1. Verificar que el token JWT se genera
2. Ir a http://localhost:8080/admin/dashboard (si eres admin)
3. Probar crear/editar productos
4. Verificar que los requests van al API Gateway
5. Ver logs en CloudWatch
