## Descripción

(Qué hace este PR y por qué)

## Checklist de PR

- [ ] He corrido `pnpm install` y `pnpm build` localmente si aplica
- [ ] Lint (`pnpm lint`) y formateo pasados
- [ ] Typecheck (`pnpm -w -s tsc --noEmit`) pasado
- [ ] Tests unitarios e2e ejecutados y pasan
- [ ] Secret scan: ninguna credencial secreta en el diff (gitleaks / manual)
- [ ] No se exponen `SUPABASE_SERVICE_ROLE_KEY` ni otras claves sensibles en variables `VITE_` o en el cliente
- [ ] Actualicé/añadí entradas en `.env.example` o en `infrastructure/.env.example` si procede (NO incluir valores secretos)
- [ ] Actualicé `docs/ENV.md` o la documentación relevante

## Tipo de cambio

- [ ] Bugfix
- [ ] Nueva funcionalidad
- [ ] Refactor
- [ ] Docs

## Notas de despliegue

(Indica pasos especiales para desplegar si aplica)

## Issue relacionado

Closes #
