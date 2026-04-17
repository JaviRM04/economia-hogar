# Reglas del proyecto — Economía del Hogar

## PROHIBIDO
- **NUNCA ejecutar `prisma db push --force-reset`** — borra todos los datos de producción
- **NUNCA ejecutar `prisma migrate reset`** — mismo efecto destructivo
- Para añadir campos o tablas nuevas: usar `prisma db push` (sin flags) o crear una migración con `prisma migrate dev --name <nombre>`

## Base de datos
- Producción: Supabase PostgreSQL (eu-west-1)
- El plan gratuito NO tiene backups automáticos — cualquier pérdida de datos es irreversible
- Antes de cualquier operación de schema, verificar dos veces que no es destructiva

## Despliegue
- Hosting: Render.com (free tier), servicio `srv-d7gvmtjeo5us739ljcpg`
- Auto-deploy en push a `master`
- Frontend pre-compilado y commiteado en `frontend/dist/`
- Build command: `npm install && npx prisma generate && npm run build`

## Usuarios de producción
- Javier Rosa: `javirm@casa.com` (telegramId: 833164789)
- Selena Ramos: `selenar@casa.com` (sin telegramId todavía)
