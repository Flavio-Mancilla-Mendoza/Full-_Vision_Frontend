# 👓 Full Vision - Sistema de Óptica Completo

## 🎯 Descripción del Proyecto

**Full Vision** es una aplicación web completa para gestión de ópticas que incluye catálogo de productos, sistema de citas médicas, panel administrativo y e-commerce integrado.

## 🚀 Características Principales

### 👥 **Para Clientes**

- 🛍️ **Catálogo de Productos**: Navegación y filtrado de monturas y lentes
- 📅 **Sistema de Citas**: Agendamiento de exámenes oculares
- 🔐 **Autenticación**: Registro y login con AWS Cognito
- 🛒 **Carrito de Compras**: Sistema completo de e-commerce
- 📱 **Responsive Design**: Optimizado para móviles y desktop

### 👨‍💼 **Para Administradores**

- 📊 **Dashboard**: Panel de control con métricas y estadísticas
- 📋 **Gestión de Citas**: Calendario, confirmación y seguimiento
- 📦 **Gestión de Productos**: CRUD completo de productos
- 🏢 **Gestión de Ubicaciones**: Múltiples sucursales
- 📈 **Analytics**: Estadísticas de ventas y citas

## 🛠️ Stack Tecnológico

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (diseño)
- **React Router 7** (navegación)
- **React Hook Form** + **Zod** (formularios)
- **React Big Calendar** (calendario)
- **TanStack Query** (gestión de estado)

### Backend & Servicios

- **AWS Lambda** (handlers de negocio con filtrado server-side)
- **Supabase** (PostgreSQL + storage + real-time)
- **AWS Cognito** (autenticación y gestión de usuarios)
- **AWS S3** (almacenamiento de imágenes)
- **Row Level Security (RLS)** (seguridad en BD)
- **PostgreSQL Indexes** (optimización de queries)

### Arquitectura de Datos

- **Filtrado Server-Side**: Todos los filtros de productos se ejecutan en el backend
- **Paginación Server-Side**: 24 productos por página cargados bajo demanda
- **Cache Inteligente**: React Query cachea cada combinación de filtros
- **Queries Optimizadas**: Uso de índices PostgreSQL para búsquedas rápidas

### Herramientas

- **ESLint** + **TypeScript** (calidad de código)
- **PWA** (aplicación web progresiva)
- **pnpm** (gestor de paquetes)

## 🏗️ Estructura del Proyecto

```
📂 full-vision-react/
├── 📁 src/
│   ├── 📁 components/    # Componentes reutilizables
│   │   ├── ui/           # Componentes shadcn/ui
│   │   └── ...
│   ├── 📁 pages/         # Páginas principales
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── Admin.tsx
│   │   └── ...
│   ├── 📁 services/      # Integración con Supabase
│   ├── 📁 hooks/         # Custom hooks
│   ├── 📁 lib/           # Configuración y utilidades
│   └── 📁 types/         # Tipos de TypeScript
├── 📁 database/          # Esquemas y migraciones SQL
├── 📁 scripts/           # Scripts de utilidad
├── 📁 docs/              # Documentación
└── 📁 public/            # Archivos estáticos
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18+
- **pnpm** (recomendado) o npm
- Cuenta en **Supabase**

### Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd full-vision-react
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env` y configura tus credenciales:

```env
# Supabase (Base de datos)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key

# AWS Cognito (Autenticación)
VITE_AWS_REGION=sa-east-1
VITE_AWS_COGNITO_USER_POOL_ID=tu_user_pool_id
VITE_AWS_COGNITO_CLIENT_ID=tu_client_id
VITE_AWS_COGNITO_DOMAIN=tu_dominio

# AWS S3 (Imágenes)
VITE_AWS_S3_IMAGES_BUCKET=tu_bucket
VITE_IMAGES_BASE_URL=tu_url_base

# App
VITE_APP_NAME="Full Vision"
```

4. **Ejecutar la aplicación**

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🗂️ Estructura monorepo actualizada

He reorganizado el repositorio en un formato de monorepo con `apps/`:

```
📂 full-vision-react/
├── 📁 apps/
│   ├── 📁 frontend/   # Vite + React app (antes en la raíz `src/`)
│   └── 📁 backend/    # API (Fastify + Prisma)
├── 📁 packages/       # Paquetes compartidos
├── 📁 database/
└── 📁 infrastructure/
```

Comandos útiles desde la raíz:

```bash
# Inicia el frontend (dev server)
pnpm --filter ./apps/frontend dev

# Inicia el backend (dev server)
pnpm --filter ./apps/backend dev

# Comando corto (mapea a frontend):
pnpm dev
```

Notas:

- Los alias `@/...` siguen funcionando. Si usas TypeScript, `tsconfig.json` ya incluye `apps/frontend/src/*` en `paths`.
- Actualiza CI y despliegues para apuntar a `apps/frontend` y `apps/backend` cuando corresponda.

## 📚 Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Genera el build de producción
- `pnpm preview` - Previsualiza el build de producción
- `pnpm lint` - Ejecuta ESLint
- `pnpm db:types` - Genera tipos de TypeScript desde Supabase

## 🗄️ Base de Datos

El proyecto utiliza **Supabase** como backend. Los esquemas SQL están en la carpeta `/database`.

### Principales Tablas

- `products` - Catálogo de productos
- `appointments` - Citas médicas
- `orders` - Pedidos
- `profiles` - Perfiles de usuario
- `locations` - Sucursales
- `site_content` - Contenido del sitio

## 🔐 Autenticación

Sistema de autenticación completo con **AWS Cognito**:

- Registro de usuarios con confirmación por email
- Login/Logout
- Recuperación de contraseña
- Gestión de grupos y roles (Admin/Customer)
- Integración con Amplify JS
- Sesiones persistentes y refresh automático de tokens

**Nota**: La base de datos (Supabase) se usa para almacenar perfiles y datos adicionales, mientras que Cognito maneja toda la autenticación.

## 📝 Notas de Desarrollo

- El proyecto usa **pnpm** para gestión de paquetes
- Las imágenes se almacenan en **AWS S3**
- Se implementa **lazy loading** para mejor performance
- PWA configurado para instalación offline

## ⚠️ Nota sobre ESM (módulos ECMAScript)

- Este repositorio está configurado con `"type": "module"` en `package.json`, por lo que los módulos usan ESM (`import`/`export`).
- Convención práctica: al importar archivos locales, incluye la extensión `.js` en el path (por ejemplo `import config from './lib/config.js'`).
- Se migraron los handlers y helpers del proxy Supabase a ESM. Si añades nuevos archivos en `packages/lambda-proxy/`, sigue la misma convención.
- Para consumir paquetes CJS desde ESM, usa `await import()` dinámico o `createRequire()` como excepción.

## 📄 Licencia

Este proyecto es privado y propietario.

## 👥 Equipo

Desarrollado para Full Vision Óptica.

---

**Última actualización**: Enero 2026
