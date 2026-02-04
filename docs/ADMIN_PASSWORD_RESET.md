# Guía: Cambio de Contraseña Temporal para Administradores

## ✅ Problema Resuelto

Cuando un administrador crea un usuario en AWS Cognito con una contraseña temporal, ese usuario debe cambiar su contraseña en el primer inicio de sesión. Ahora la aplicación maneja este flujo automáticamente.

## 🔄 Flujo Implementado

### 1. **Login con Contraseña Temporal**

Cuando un usuario intenta iniciar sesión con una contraseña temporal:

- El sistema detecta el estado `NEW_PASSWORD_REQUIRED` de Cognito
- Automáticamente muestra un formulario de cambio de contraseña
- El usuario NO necesita contactar al administrador

### 2. **Formulario de Cambio de Contraseña**

El nuevo formulario incluye:

- ✅ Campo para nueva contraseña
- ✅ Campo de confirmación
- ✅ Validación de políticas de Cognito:
  - Mínimo 8 caracteres
  - Al menos una letra mayúscula
  - Al menos una letra minúscula
  - Al menos un número
  - Al menos un carácter especial
- ✅ Indicador de carga durante el proceso
- ✅ Mensajes de error claros

### 3. **Después del Cambio**

Una vez cambiada la contraseña:

- ✅ El usuario es autenticado automáticamente
- ✅ Redirigido al dashboard correspondiente
- ✅ La nueva contraseña es permanente

## 🛠️ Crear Nuevo Usuario Admin

### Opción 1: AWS Console (Recomendado)

1. Ve a AWS Cognito → User Pools → `full-vision-users-dev`
2. Click en "Create user"
3. Completa:
   - Username: `admin@tudominio.com`
   - Temporary password: `TempPass123!` (debe cumplir política)
   - Email: `admin@tudominio.com`
   - Mark email as verified: ✅
4. Click "Create user"
5. **Agregar al grupo Admins**:
   - En la pestaña del usuario, ve a "Groups"
   - Click "Add user to group"
   - Selecciona `Admins`
   - Click "Add"

### Opción 2: AWS CLI

```bash
# Crear usuario
aws cognito-idp admin-create-user \
   --user-pool-id sa-east-1_xxxxxxxxx \
  --username admin@tudominio.com \
  --user-attributes Name=email,Value=admin@tudominio.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# Agregar al grupo Admins
aws cognito-idp admin-add-user-to-group \
   --user-pool-id sa-east-1_xxxxxxxxx \
  --username admin@tudominio.com \
  --group-name Admins
```

## 📋 Proceso de Login del Nuevo Admin

1. **Primer Login**:

   - Ir a `/login`
   - Ingresar email: `admin@tudominio.com`
   - Ingresar contraseña temporal: `TempPass123!`
   - Click "Iniciar sesión"

2. **Cambio de Contraseña Automático**:

   - El sistema detecta la contraseña temporal
   - Muestra un mensaje: "Contraseña temporal detectada. Debes establecer una nueva contraseña..."
   - Formulario aparece automáticamente

3. **Establecer Nueva Contraseña**:

   - Ingresar nueva contraseña (cumplir requisitos)
   - Confirmar nueva contraseña
   - Click "Establecer contraseña e iniciar sesión"

4. **Acceso Concedido**:
   - El sistema actualiza la contraseña
   - Autentica automáticamente al usuario
   - Redirige a `/admin/dashboard`

## 🔐 Política de Contraseñas

La contraseña debe cumplir:

- ✅ Mínimo 8 caracteres
- ✅ Al menos una letra mayúscula (A-Z)
- ✅ Al menos una letra minúscula (a-z)
- ✅ Al menos un número (0-9)
- ✅ Al menos un carácter especial (!@#$%^&\*()\_+-=[]{}|;:,.<>?)

Ejemplos válidos:

- `Admin2026!`
- `FullVision@123`
- `SecureP@ss99`

## 🚨 Resetear Contraseña de Usuario Existente

Si un admin olvida su contraseña:

### Opción 1: AWS Console

1. AWS Cognito → User Pools → Users
2. Busca el usuario
3. Click en "Actions" → "Reset password"
4. Se enviará una contraseña temporal por email (si está configurado SES)

### Opción 2: AWS CLI

```bash
aws cognito-idp admin-set-user-password \
   --user-pool-id sa-east-1_xxxxxxxxx \
  --username admin@tudominio.com \
  --password "NewTempPass123!" \
  --permanent false
```

## 📝 Archivos Modificados

Los cambios implementados están en:

1. **[cognito-auth.ts](../src/services/cognito-auth.ts)**:

   - Nueva función: `completeNewPasswordChallenge()`
   - Actualizado `loginUser()` para detectar estado `NEW_PASSWORD_REQUIRED`
   - Exporta la nueva función

2. **[AuthCard.tsx](../src/components/auth/AuthCard.tsx)**:
   - Nuevo modo: `newPassword`
   - Formulario de cambio de contraseña con validación
   - Manejo automático del flujo de cambio
   - Mensajes informativos para el usuario

## 🔍 Verificar Configuración

Para confirmar que tu User Pool está correctamente configurado:

```bash
# Ver detalles del User Pool
aws cognito-idp describe-user-pool \
   --user-pool-id sa-east-1_xxxxxxxxx

# Verificar grupos
aws cognito-idp list-groups \
   --user-pool-id sa-east-1_xxxxxxxxx

# Ver usuarios en grupo Admins
aws cognito-idp list-users-in-group \
   --user-pool-id sa-east-1_xxxxxxxxx \
   --group-name Admins
```

## 🎯 Testing

Para probar el flujo completo:

1. Crear un usuario de prueba con contraseña temporal
2. Intentar login en la app
3. Verificar que aparece el formulario de cambio de contraseña
4. Cambiar contraseña exitosamente
5. Verificar redirección al dashboard
6. Hacer logout y login nuevamente con la nueva contraseña

---

**Nota**: Este flujo es automático y no requiere intervención del administrador. Los usuarios nuevos pueden completar el cambio de contraseña por sí mismos en el primer login.
