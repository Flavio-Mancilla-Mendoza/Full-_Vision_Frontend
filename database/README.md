# 🗃️ Database Schema - Full Vision

## 📋 Archivos SQL Activos

### 🏗️ **`full_vision_schema.sql`** - ESQUEMA PRINCIPAL

**Propósito**: Schema base completo con todas las tablas fundamentales
**Contiene**:

- Tablas de usuarios (`profiles`)
- Sistema de productos (`products`, `brands`, `categories`)
- Sistema de órdenes (`orders`, `order_items`)
- Carritos de compra (`cart_items`)
- Ubicaciones base (`eye_exam_locations`)
- Políticas RLS básicas

**Cuándo usar**: Primera instalación de la base de datos

---

### 📅 **`setup-appointments-tables.sql`** - SISTEMA DE CITAS

**Propósito**: Sistema completo de gestión de citas médicas
**Contiene**:

- Tabla `eye_exam_appointments` (citas)
- Políticas RLS para citas
- Datos de ubicaciones por defecto
- Compatibilidad con esquemas existentes

**Cuándo usar**: Después del schema principal, para habilitar el sistema de citas

---

### 🔒 **`setup-supabase-security.sql`** - POLÍTICAS DE SEGURIDAD

**Propósito**: Configuración avanzada de Row Level Security
**Contiene**:

- Políticas de admin para todas las tablas
- Funciones auxiliares de verificación de roles
- Políticas de lectura pública
- Configuración de seguridad para producción

**Cuándo usar**: Después de los schemas principales, para securizar el sistema

---

### 🎨 **`site-content-management.sql`** - GESTIÓN DE CONTENIDO

**Propósito**: Sistema de contenido dinámico para el frontend
**Contiene**:

- Tabla `site_content` para contenido editable
- Sistema de imágenes configurables
- Políticas para admin de contenido
- Estructura para carousel, hero, etc.

**Cuándo usar**: Opcional, para habilitar gestión dinámica de contenido

---

## 🚀 Orden de Ejecución Recomendado

```sql
-- 1. Schema base (OBLIGATORIO)
\i database/full_vision_schema.sql

-- 2. Sistema de citas (OBLIGATORIO para funcionalidad de citas)
\i database/setup-appointments-tables.sql

-- 3. Políticas de seguridad (RECOMENDADO para producción)
\i database/setup-supabase-security.sql

-- 4. Gestión de contenido (OPCIONAL)
\i database/site-content-management.sql
```

## 📊 Estado Después de la Limpieza

- **ANTES**: 22 archivos SQL (confusos, duplicados, experimentales)
- **DESPUÉS**: 4 archivos SQL (claros, específicos, funcionales)
- **Reducción**: 82% menos archivos

## ✅ Beneficios

1. **Claridad total**: Cada archivo tiene un propósito específico
2. **Sin duplicación**: No hay archivos obsoletos o experimentales
3. **Fácil mantenimiento**: Solo 4 archivos para mantener
4. **Documentación clara**: Cada uno está documentado
5. **Orden lógico**: Secuencia clara de ejecución

---

_Base de datos limpia y organizada - Noviembre 2025_
