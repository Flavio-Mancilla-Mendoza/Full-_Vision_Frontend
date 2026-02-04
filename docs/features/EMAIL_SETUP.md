# Configuración de Emails con Resend

Esta guía te ayudará a configurar el envío automático de emails de confirmación de pedidos usando Resend y Supabase Edge Functions.

## 📋 Requisitos Previos

- Cuenta de Supabase (ya tienes)
- Cuenta de Resend (gratis: 100 emails/día)
- Supabase CLI instalado

## 🚀 Pasos de Configuración

### 1. Crear cuenta en Resend

1. Ve a [https://resend.com/signup](https://resend.com/signup)
2. Regístrate con tu email
3. Verifica tu email

### 2. Obtener API Key de Resend

1. Inicia sesión en Resend
2. Ve a **API Keys** en el menú lateral
3. Click en **Create API Key**
4. Dale un nombre: `full-vision-production`
5. Copia la API Key (guárdala, solo se muestra una vez)

### 3. Verificar tu dominio (Opcional pero recomendado)

**Opción A: Usar dominio personalizado (recomendado para producción)**

1. En Resend, ve a **Domains**
2. Click **Add Domain**
3. Ingresa tu dominio: `fullvision.pe`
4. Sigue las instrucciones para agregar registros DNS
5. Espera verificación (puede tomar hasta 48 horas)

**Opción B: Usar dominio de prueba (para desarrollo)**

- Resend te da un dominio de prueba: `onboarding@resend.dev`
- Solo puedes enviar a tu propio email
- Perfecto para testing inicial

### 4. Instalar Supabase CLI

**Windows (PowerShell):**

```powershell
scoop install supabase
```

O descarga desde: [https://github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)

**Verificar instalación:**

```bash
supabase --version
```

### 5. Login en Supabase CLI

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### 6. Vincular proyecto

```bash
cd C:/Users/flavi/OneDrive/Documentos/develop/full-vision-react
supabase link --project-ref txjryksczwwthbgmmjms
```

### 7. Configurar variable de entorno (API Key de Resend)

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

⚠️ **Importante:** Reemplaza `re_your_api_key_here` con tu API key real de Resend.

### 8. Desplegar Edge Function

```bash
supabase functions deploy send-order-confirmation
```

### 9. Actualizar email del admin

Edita el archivo `supabase/functions/send-order-confirmation/index.ts`:

Busca la línea 70:

```typescript
to: ["flaviomancilla0@gmail.com"], // Cambiar por email del admin
```

Cámbiala por tu email de administrador real.

Luego vuelve a desplegar:

```bash
supabase functions deploy send-order-confirmation
```

### 10. Actualizar el email "from" en producción

Si verificaste tu dominio en Resend, actualiza las líneas 48 y 61:

```typescript
from: "Full Vision Óptica <pedidos@fullvision.pe>",
```

y

```typescript
from: "Full Vision Óptica <sistema@fullvision.pe>",
```

## ✅ Verificación

### Probar la función manualmente:

```bash
curl -i --location --request POST 'https://txjryksczwwthbgmmjms.supabase.co/functions/v1/send-order-confirmation' \
  --header 'Authorization: Bearer TU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "order_number": "TEST-001",
    "customer_name": "Test Usuario",
    "customer_email": "tu-email@gmail.com",
    "customer_phone": "999999999",
    "total_amount": 100,
    "subtotal": 84.75,
    "tax_amount": 15.25,
    "shipping_amount": 0,
    "customer_dni": "12345678",
    "payment_method": "Yape",
    "items": [
      {
        "name": "Producto Test",
        "quantity": 1,
        "unit_price": 84.75,
        "total_price": 84.75
      }
    ]
  }'
```

Deberías recibir un email en la dirección especificada.

## 📧 Tipos de Emails

### Email al Cliente

- ✅ Confirmación de pedido
- 📦 Detalles del pedido (productos, precios, totales)
- 🏠 Dirección de envío O punto de retiro
- ⚠️ Recordatorio de traer DNI (si es retiro en tienda)

### Email al Admin

- 🛒 Notificación de nuevo pedido
- 👤 Datos del cliente
- 📋 Lista de productos
- 🔗 Enlace al dashboard (opcional)

## 🔧 Troubleshooting

### "Error: RESEND_API_KEY is not set"

```bash
supabase secrets set RESEND_API_KEY=tu_api_key_real
```

### "Function not found"

```bash
supabase functions deploy send-order-confirmation
```

### "Email not sent"

1. Verifica que la API key sea correcta
2. Revisa los logs:

```bash
supabase functions logs send-order-confirmation
```

### Los emails van a spam

1. Verifica tu dominio en Resend
2. Configura SPF, DKIM y DMARC records
3. Usa un dominio verificado en lugar de `resend.dev`

## 💰 Límites y Pricing

**Plan Free de Resend:**

- ✅ 100 emails por día
- ✅ 1 dominio verificado
- ✅ API access completo

**Si necesitas más:**

- $20/mes → 50,000 emails/mes
- Sin límite diario

## 🎯 Próximos Pasos

Una vez configurado, cada vez que un cliente complete un pedido:

1. ✅ Se crea el pedido en la base de datos
2. 📧 Se envía email al cliente con confirmación
3. 🔔 Se envía email al admin notificando nuevo pedido
4. ↪️ El cliente es redirigido a la página de confirmación

## 📝 Notas Importantes

- Los emails se envían de forma **asíncrona**, no bloquean el checkout
- Si falla el envío de email, el pedido **sí se crea** igual
- Los errores de email se loggean pero no se muestran al usuario
- Puedes ver los logs en el dashboard de Supabase → Edge Functions

## 🔗 Enlaces Útiles

- [Resend Dashboard](https://resend.com/dashboard)
- [Resend Docs](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
