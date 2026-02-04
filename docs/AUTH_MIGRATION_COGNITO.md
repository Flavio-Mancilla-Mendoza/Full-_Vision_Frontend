# Migración de Autenticación: Supabase → AWS Cognito

## Estado: ✅ COMPLETADA

**Fecha:** Enero 2025  
**Región AWS:** sa-east-1 (São Paulo, Brasil)

---

## 📋 Resumen

Se ha completado exitosamente la migración del sistema de autenticación de Supabase Auth a AWS Cognito. Esta migración permite:

- ✅ Autenticación nativa con AWS
- ✅ Gestión de usuarios sin base de datos externa
- ✅ Mejor integración con infraestructura AWS (RDS, S3, Lambda)
- ✅ Latencia reducida para usuarios en Sudamérica (~20-50ms vs ~150-200ms)

---

## 🏗️ Infraestructura AWS Configurada

### Cognito User Pool

- **Pool ID:** `sa-east-1_A4YLB61FR`
- **Client ID:** `4fg5p06k3hma0s80ok8kova9m9`
- **Domain:** `full-vision-dev.auth.sa-east-1.amazoncognito.com`
- **Región:** sa-east-1 (São Paulo)

### Políticas de Contraseña Cognito

```
- Mínimo 8 caracteres
- Al menos 1 letra minúscula
- Al menos 1 letra mayúscula
- Al menos 1 número
- Al menos 1 carácter especial (!@#$%^&*)
```

### Usuario Administrador

- **Username:** `admin-fullvision`
- **Email:** `flavio_mancillamendoza@outlook.es`
- **Password Temporal:** `Admin2026!` (debe cambiar en primer login)
- **Grupo:** `Admins`

### S3 Buckets (CORS Configurado)

- **Frontend:** `fullvisioninfrastructuresta-frontendbucketefe2e19c-k3evnrsnmqmv`
- **Images:** `fullvisioninfrastructures-productimagesbucket03bda-dfbsfpswo25e`

---

## 📦 Dependencias Instaladas

```json
{
  "devDependencies": {
    "@aws-amplify/auth": "^6.17.1",
    "@aws-amplify/core": "^6.15.0"
  }
}
```

**Instalación:** `pnpm add -D @aws-amplify/auth @aws-amplify/core`

---

## 📁 Archivos Creados/Modificados

### ✨ Nuevos Archivos

#### 1. `src/lib/amplify-config.ts`

Configuración de AWS Amplify con Cognito.

```typescript
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "sa-east-1_A4YLB61FR",
      userPoolClientId: "4fg5p06k3hma0s80ok8kova9m9",
      region: "sa-east-1",
      // ...
    },
  },
};
```

#### 2. `src/services/cognito-auth.ts`

Servicio de autenticación con Cognito (12+ métodos).

**Métodos principales:**

- `registerUser()` - Registro de nuevos usuarios
- `confirmUserRegistration()` - Confirmar email con código
- `resendConfirmationCode()` - Reenviar código de verificación
- `loginUser()` - Iniciar sesión
- `logoutUser()` - Cerrar sesión
- `changePassword()` - Cambiar contraseña
- `forgotPassword()` - Recuperar contraseña
- `resetPasswordWithCode()` - Resetear con código
- `updateUserProfile()` - Actualizar perfil
- `getCurrentAuthUser()` - Obtener usuario actual
- `getCurrentAuthSession()` - Obtener sesión
- `isAuthenticated()` - Verificar autenticación

#### 3. `src/hooks/useAuthCognito.ts`

Hooks de React para autenticación con Cognito.

**Hooks disponibles:**

- `useSession()` - Sesión actual con listeners de Hub
- `useAuth()` - Autenticación básica
- `useIsAdmin()` - Verificar si es admin
- `useUser()` - Compatible con API anterior (migración fácil)
- `getProfile()` - Obtener perfil de usuario

---

### 🔄 Archivos Modificados

#### 1. `src/main.tsx`

```typescript
import { configureAmplify } from "@/lib/amplify-config";

// Configurar Amplify al inicio
configureAmplify();
```

#### 2. `src/components/auth/AuthCard.tsx`

- ✅ Migrado de Supabase a Cognito
- ✅ Agregado modo "confirm" para verificación de email
- ✅ Actualizada validación de contraseña (8 caracteres + complejidad)
- ✅ Implementado flujo: Register → Confirm → Login
- ✅ Agregado botón "Reenviar código"

#### 3. `src/components/auth/AuthRequired.tsx`

```typescript
// Antes
import { useUser } from "@/hooks/useUser";

// Ahora
import { useAuth } from "@/hooks/useAuthCognito";
```

#### 4. `src/components/auth/AuthGate.tsx`

```typescript
// Ahora usa useSession y useAuth de Cognito
import { useSession, useAuth } from "@/hooks/useAuthCognito";
```

#### 5. Actualización Masiva de Imports (12 archivos)

Todos los archivos que usaban `@/hooks/useUser` ahora usan `@/hooks/useAuthCognito`:

- `src/pages/Checkout.tsx`
- `src/pages/MisPedidos.tsx`
- `src/pages/MisCitas.tsx`
- `src/pages/Index.tsx`
- `src/pages/Citas.tsx`
- `src/pages/Cart.tsx`
- `src/pages/Profile.tsx`
- `src/hooks/useAppointments.ts`
- `src/hooks/useOrders.ts`
- `src/hooks/useOptimizedAuthCart.ts`
- `src/components/common/OptimizedLoader.tsx`
- `src/components/hero/HeroSimple.tsx`
- `src/components/layout/Navbar.tsx`

---

## 🚀 Flujo de Autenticación

### 1️⃣ Registro de Usuario

```typescript
const result = await registerUser(email, password, fullName);
// Usuario creado → Email de verificación enviado
```

### 2️⃣ Confirmación de Email

```typescript
const result = await confirmUserRegistration(email, verificationCode);
// Cuenta verificada → Puede iniciar sesión
```

### 3️⃣ Inicio de Sesión

```typescript
const result = await loginUser(email, password);
// Sesión iniciada → Token JWT generado
```

### 4️⃣ Cerrar Sesión

```typescript
await logoutUser();
// Sesión terminada → Tokens eliminados
```

### 5️⃣ Cambiar Contraseña (Usuario Autenticado)

```typescript
await changePassword(oldPassword, newPassword);
```

### 6️⃣ Recuperar Contraseña (Olvidó Contraseña)

```typescript
// Paso 1: Solicitar código
await forgotPassword(email);

// Paso 2: Resetear con código
await resetPasswordWithCode(email, code, newPassword);
```

---

## 🔐 Verificación de Roles

### Admin Check

```typescript
const { isAdmin, loading } = useAuth();

if (isAdmin) {
  // Usuario es administrador
}
```

### Grupos de Cognito

- Grupo: **Admins** → Rol: `admin`
- Sin grupo → Rol: `customer`

---

## 🧪 Testing

### Build Exitoso

```bash
$ pnpm build
✓ 3898 modules transformed
✓ Build completado sin errores
```

### Probar Autenticación

1. **Iniciar servidor:**

   ```bash
   pnpm dev
   ```

2. **Registrar nuevo usuario:**

   - Ir a `/login`
   - Click "Crear cuenta"
   - Ingresar datos (password debe cumplir requisitos)
   - Revisar email para código de verificación

3. **Confirmar email:**

   - Ingresar código de 6 dígitos
   - Click "Verificar cuenta"

4. **Iniciar sesión:**

   - Usar email y password
   - Verificar redirección correcta

5. **Probar admin:**
   - Login con: `admin-fullvision` / `Admin2026!`
   - Sistema pedirá cambiar password temporal
   - Verificar acceso a `/admin/dashboard`

---

## 📝 Notas Importantes

### ⚠️ Cambios Importantes

1. **Passwords más estrictos:**

   - Supabase: mínimo 6 caracteres
   - Cognito: mínimo 8 caracteres + complejidad

2. **Verificación de email obligatoria:**

   - Los usuarios deben verificar su email antes de poder iniciar sesión
   - Se envía código de 6 dígitos al registrarse

3. **No hay perfiles en DB (por ahora):**

   - Los datos de perfil se almacenan en atributos de Cognito
   - Cuando se cree la DB, se sincronizarán con PostgreSQL

4. **Tokens JWT:**
   - Access Token: autenticación API
   - ID Token: información del usuario
   - Refresh Token: renovar sesión

---

## 🔜 Próximos Pasos

### ⏳ Pendiente (cuando AWS verifique cuenta)

1. **Crear schema de base de datos:**

   ```bash
   # En AWS CloudShell (sa-east-1)
   bash scripts/setup-db-cloudshell.sh
   ```

2. **Sincronizar perfiles con DB:**

   - Crear tabla `profiles` en PostgreSQL
   - Lambda para sincronizar al registrarse
   - Trigger en Cognito PostConfirmation

3. **Implementar backend API:**

   - Lambda + API Gateway
   - Validación JWT de Cognito
   - CRUD operations con RDS

4. **Testing completo:**
   - Registro → Confirmación → Login
   - Cambio de password
   - Recuperación de password
   - Admin dashboard
   - User dashboard

---

## 🐛 Troubleshooting

### Error: "User is not confirmed"

**Solución:** El usuario debe verificar su email con el código de 6 dígitos enviado.

### Error: "Incorrect username or password"

**Solución:** Verificar que:

- Email esté verificado
- Password cumpla requisitos de Cognito
- No hay espacios extras en email/password

### Error: "Password does not conform to policy"

**Solución:** La contraseña debe tener:

- Mínimo 8 caracteres
- Mayúsculas, minúsculas, números y caracteres especiales

### No recibo el código de verificación

**Solución:**

1. Revisar carpeta de spam
2. Verificar que el email sea correcto
3. Usar botón "Reenviar código"

---

## 📚 Referencias

- [AWS Amplify Auth Docs](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [AWS Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [Amplify Auth API Reference](https://docs.amplify.aws/javascript/build-a-backend/auth/connect-your-frontend/sign-up/)

---

## ✅ Checklist de Migración

- [x] Configurar Cognito User Pool en sa-east-1
- [x] Instalar AWS Amplify packages
- [x] Crear configuración de Amplify
- [x] Implementar servicio de autenticación
- [x] Crear hooks de React
- [x] Migrar AuthCard component
- [x] Actualizar AuthRequired component
- [x] Actualizar AuthGate component
- [x] Actualizar todos los imports de useUser
- [x] Crear usuario admin
- [x] Configurar CORS en S3
- [x] Build exitoso
- [ ] Testing completo (pendiente después de AWS verification)
- [ ] Crear schema de DB
- [ ] Implementar backend API
- [ ] Desplegar a producción

---

**Última actualización:** Enero 2025  
**Estado:** ✅ Migración completada - Listo para testing cuando AWS verifique cuenta
