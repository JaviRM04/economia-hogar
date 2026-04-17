# Arquitectura del Proyecto — Economía del Hogar

## Stack tecnológico

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Frontend | React + TypeScript + Vite | Velocidad de desarrollo, tipado fuerte, HMR |
| Estilos | Tailwind CSS | Utility-first, mobile-first sin esfuerzo |
| Gráficos | Recharts | Open source, composable, fácil con React |
| Routing | React Router v6 | Estándar de facto en React |
| PWA | vite-plugin-pwa | Service worker + manifest automático |
| Backend | Node.js + Express + TypeScript | Ecosistema npm, mismo lenguaje que frontend |
| ORM | Prisma | Type-safe, migraciones automáticas, DX excelente |
| Base de datos | PostgreSQL | Robusta, gratuita, relacional (datos financieros) |
| Auth | JWT + bcrypt | Sin dependencias externas, stateless |
| Bot | grammY | Mejor librería Telegram para Node.js, gratuita |
| IA | Anthropic Claude API | Procesamiento lenguaje natural para el bot |
| Infraestructura | Docker Compose | Un comando para levantar todo |

## Estructura de carpetas

```
/
├── frontend/                    # App React
│   ├── public/
│   │   ├── icons/               # Iconos PWA (varios tamaños)
│   │   └── manifest.json        # Web App Manifest
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── ui/              # Primitivos: Button, Card, Input, Modal...
│   │   │   ├── layout/          # Sidebar, BottomNav, Header
│   │   │   └── charts/          # Gráficos específicos del dominio
│   │   ├── pages/               # Una carpeta por módulo
│   │   │   ├── Dashboard/
│   │   │   ├── Gastos/
│   │   │   ├── Ingresos/
│   │   │   ├── Facturas/
│   │   │   ├── Deudas/
│   │   │   ├── Metas/
│   │   │   └── Ajustes/
│   │   ├── hooks/               # Custom hooks (useAuth, useGastos...)
│   │   ├── services/            # Llamadas a la API REST
│   │   ├── store/               # Estado global (Context o Zustand)
│   │   ├── types/               # Interfaces TypeScript compartidas
│   │   └── utils/               # Helpers: formatCurrency, formatDate...
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # API REST + Bot Telegram
│   ├── prisma/
│   │   ├── schema.prisma        # Esquema de la BD
│   │   └── seed.ts              # Datos de ejemplo
│   └── src/
│       ├── modules/             # Un módulo = un dominio de negocio
│       │   ├── auth/            # Login, registro, JWT
│       │   ├── gastos/          # CRUD gastos + subida fotos
│       │   ├── ingresos/        # CRUD ingresos
│       │   ├── facturas/        # Facturas recurrentes
│       │   ├── deudas/          # Deudas internas
│       │   ├── metas/           # Metas de ahorro
│       │   └── usuarios/        # Perfil, settings, categorías
│       ├── bot/                 # Bot de Telegram
│       │   ├── index.ts         # Inicialización grammY
│       │   ├── handlers/        # Handlers por tipo de mensaje
│       │   └── claude.ts        # Integración con Anthropic API
│       ├── middleware/
│       │   ├── auth.ts          # Verificación JWT
│       │   └── upload.ts        # Multer para fotos
│       ├── lib/
│       │   ├── prisma.ts        # Singleton cliente Prisma
│       │   └── claude.ts        # Cliente Anthropic
│       └── index.ts             # Entry point Express
│
├── ARCHITECTURE.md              # Este archivo
├── PROGRESS.md                  # Estado del proyecto
├── docker-compose.yml           # PostgreSQL + App
├── .env.example                 # Variables de entorno documentadas
└── .gitignore
```

## Módulos del backend

Cada módulo sigue la misma estructura:

```
modules/gastos/
├── gastos.router.ts     # Definición de rutas Express
├── gastos.controller.ts # Lógica de request/response
├── gastos.service.ts    # Lógica de negocio + Prisma
└── gastos.types.ts      # Interfaces y validaciones Zod
```

Este patrón garantiza separación de responsabilidades. Para añadir un nuevo módulo:
1. Crear la carpeta en `modules/`
2. Crear los 4 archivos siguiendo el mismo patrón
3. Registrar el router en `src/index.ts`
4. Añadir el modelo en `prisma/schema.prisma`
5. Ejecutar `npx prisma migrate dev`

## Cómo levantar el proyecto desde cero

### Requisitos previos
- Docker Desktop instalado y corriendo
- Node.js 18+ (solo para desarrollo local sin Docker)

### Con Docker (recomendado)
```bash
cp .env.example .env
# Editar .env con tus valores
docker-compose up --build
```

Esto levanta:
- PostgreSQL en puerto 5432
- Backend en puerto 3000
- Frontend en puerto 5173

### Sin Docker (desarrollo)
```bash
# Terminal 1 — Base de datos (necesita Docker)
docker-compose up postgres

# Terminal 2 — Backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev
```

## Configurar Telegram Webhook con Ngrok

Para que el bot reciba mensajes en desarrollo local:

```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3000

# Copiar la URL https://xxxx.ngrok.io
# El backend la registra automáticamente al arrancar si NGROK_URL está en .env
```

## Variables de entorno

Ver `.env.example` para la lista completa con descripciones.
Las variables sensibles (tokens, claves) **nunca** deben commitearse.

## Decisiones de diseño

- **PostgreSQL sobre SQLite**: los datos financieros requieren transacciones ACID reales y concurrencia multi-usuario
- **Prisma sobre Sequelize**: mejor DX, tipos generados automáticamente, migraciones más robustas
- **grammY sobre node-telegram-bot-api**: mantenimiento activo, middleware pattern, mejor TypeScript support
- **JWT stateless**: sin sesiones en servidor, escala horizontalmente sin Redis
- **Módulos independientes**: cada módulo puede modificarse, probarse y desplegarse sin afectar a los demás
