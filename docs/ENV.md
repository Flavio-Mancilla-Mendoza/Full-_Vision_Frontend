**Variables de entorno y manejo de secretos**

- No almacenar secretos en el repositorio. Usa AWS Secrets Manager, Parameter Store, HashiCorp Vault o SOPS + KMS para producción.
- Para desarrollo local: copia `.env.example` a `.env` en la raíz y llena los valores necesarios.
- Variables expuestas al cliente (prefijo `VITE_`) deben contener solo valores seguros (URLs públicos, IDs). Nunca pongas claves privadas ni `SERVICE_ROLE_KEY` en `VITE_`.
- Variables sensibles (ej. `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`) deben inyectarse en el servidor/lambda o en CI desde el gestor de secretos.
- Añade rotación de claves y revocación como parte de procesos operativos.

Pasos rápidos:

1. Copiar `.env.example` → `.env`:

```bash
cp .env.example .env
```

2. Para producción, configurar CI/CD para leer secretos desde AWS Secrets Manager y no usar archivos `.env` en el repo.
