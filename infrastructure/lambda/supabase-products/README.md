Supabase Proxy Lambda — Empaquetado y despliegue

Este documento muestra pasos recomendados para instalar dependencias y empaquetar la función Lambda `supabase-products` de forma que incluya `node_modules` necesarios (p.ej. `@supabase/functions-js`).

Recomendación general
- Si trabajas con el monorepo, instala dependencias desde la raíz del repo (pnpm workspace) para mantener coherencia:

```bash
# Desde la raíz del repo
pnpm install
```

Empaquetado (ZIP) — opción 1: instalar dentro de la carpeta y crear zip (Linux / macOS)

```bash
cd infrastructure/lambda/supabase-products
pnpm install --prod
# Empaqueta los archivos que necesita la lambda
zip -r supabase-products.zip index.js lib handlers package.json node_modules
# Subir supabase-products.zip al Lambda (console o CLI)
```

Empaquetado (ZIP) — opción 2: Windows PowerShell

```powershell
Set-Location infrastructure/lambda/supabase-products
pnpm install --prod
Compress-Archive -Path index.js,lib,handlers,package.json,node_modules -DestinationPath supabase-products.zip -Force
```

Notas y buenas prácticas
- Asegúrate de que `@supabase/functions-js` y otras dependencias necesarias estén en `dependencies` (no en `devDependencies`) de `package.json` dentro de esta carpeta.
- Si usas un bundler (esbuild/webpack), puedes empaquetar todo en un único archivo y evitar incluir `node_modules` completos; en ese caso asegúrate de no marcar `@supabase/functions-js` como external.
- Con `pnpm` la estructura de `node_modules` puede ser diferente; si el empaquetado falla, prueba:

```bash
pnpm install --prod --shamefully-hoist
```

- Alternativa: usar un pipeline (CDK / Serverless) que instale dependencias y cree el artefacto automáticamente.

Verificación rápida
- Después de subir el ZIP, prueba la función en AWS Console o invoca con la API Gateway para verificar que el error `Cannot find module '@supabase/functions-js'` desapareció.

Si quieres, puedo añadir un script de `package.json` aquí para automatizar el `pnpm install --prod` + zip (cross-platform) o crear un pequeño archivo Node para empaquetar de forma portable. ¿Lo quieres?
