# Estado del proyecto

## ✅ Módulos completados
- Infraestructura base (docker-compose, .env, estructura de carpetas)
- Backend — Esquema Prisma completo (7 modelos)
- Backend — Seed de datos de ejemplo (usuarios demo, gastos, ingresos, facturas, deudas, metas)
- Backend — Módulo Auth (login, registro, JWT, perfil)
- Backend — Módulo Gastos (CRUD, filtros, subida tickets, resumen, comparativa)
- Backend — Módulo Ingresos (CRUD, resumen por usuario)
- Backend — Módulo Facturas recurrentes (CRUD, marcar pagada, próximas semana)
- Backend — Módulo Deudas internas (CRUD, liquidar, balance neto)
- Backend — Módulo Metas de ahorro (CRUD, aportaciones, progreso)
- Backend — Módulo Usuarios/Ajustes (presupuestos, categorías custom, exportar CSV)
- Backend — Bot de Telegram (grammY, Claude AI, registro gastos/deudas/aportaciones, consultas)
- Frontend — Stack (React + TypeScript + Vite + Tailwind)
- Frontend — PWA (vite-plugin-pwa, manifest, service worker)
- Frontend — Auth store (Context + JWT)
- Frontend — Layout (Sidebar escritorio + BottomNav móvil)
- Frontend — Página Login
- Frontend — Dashboard (KPIs, gráfico dona, barras, facturas próximas, deudas, metas)
- Frontend — Página Gastos (listado, filtros, formulario con subida ticket)
- Frontend — Página Ingresos (listado, resumen por usuario, formulario)
- Frontend — Página Facturas (listado, marcar pagada, alerta urgente)
- Frontend — Página Deudas (balance neto, historial, liquidar)
- Frontend — Página Metas (progreso, aportaciones, historial)
- Frontend — Página Ajustes (perfil, Telegram ID, presupuestos, exportar CSV)

## 🔄 Módulo en curso
- Ninguno — Proyecto completamente implementado

## ⏳ Módulos pendientes
- Ninguno

## 📝 Configuración pendiente del usuario
- **Credenciales de demo ya incluidas en el seed:**
  - javi@demo.com / demo1234
  - ana@demo.com / demo1234
- **Configurar en `.env` antes de usar el bot:**
  - `ANTHROPIC_API_KEY` — clave de Anthropic
  - `TELEGRAM_BOT_TOKEN` — crear bot con @BotFather
  - `TELEGRAM_GROUP_ID` — añadir @userinfobot al grupo
  - `TELEGRAM_USER1_ID` / `TELEGRAM_USER2_ID` — mensaje a @userinfobot
- **Para configurar Telegram IDs de forma cómoda:** ir a la app web → Ajustes → Telegram

## 🚀 Cómo arrancar

```bash
# 1. Copiar .env.example
cp .env.example .env
# 2. Editar .env con tus valores
# 3. Arrancar todo con Docker
docker-compose up --build
```

La app estará en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## 🛠️ Desarrollo sin Docker

```bash
# Terminal 1 — Solo postgres en Docker
docker-compose up postgres

# Terminal 2 — Backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```
