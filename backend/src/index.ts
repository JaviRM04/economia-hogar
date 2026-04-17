import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRouter from './modules/auth/auth.router';
import gastosRouter from './modules/gastos/gastos.router';
import ingresosRouter from './modules/ingresos/ingresos.router';
import facturasRouter from './modules/facturas/facturas.router';
import deudasRouter from './modules/deudas/deudas.router';
import metasRouter from './modules/metas/metas.router';
import usuariosRouter from './modules/usuarios/usuarios.router';
import { iniciarBot, obtenerBot, webhookCallback } from './bot';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── Middlewares ──────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (isProd) {
      // En producción: permitir el dominio de Render y sin origin
      const allowed = process.env.FRONTEND_URL;
      if (!origin || origin === allowed) callback(null, true);
      else callback(new Error('CORS no permitido'));
    } else {
      // En desarrollo: permitir localhost e IPs locales
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS no permitido'));
      }
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos de tickets subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Rutas API ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/gastos', gastosRouter);
app.use('/api/ingresos', ingresosRouter);
app.use('/api/facturas', facturasRouter);
app.use('/api/deudas', deudasRouter);
app.use('/api/metas', metasRouter);
app.use('/api/usuarios', usuariosRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Bot de Telegram ──────────────────────────────────────────────────────────
const bot = iniciarBot();

if (bot) {
  const ngrokUrl = process.env.NGROK_URL;

  if (ngrokUrl) {
    // Modo webhook (con ngrok en desarrollo o dominio en producción)
    const webhookPath = `/bot${process.env.TELEGRAM_BOT_TOKEN}`;
    app.use(webhookPath, webhookCallback(bot, 'express'));

    bot.api.setWebhook(`${ngrokUrl}${webhookPath}`).then(() => {
      console.log(`🤖 Bot webhook registrado en ${ngrokUrl}${webhookPath}`);
    }).catch(console.error);
  } else {
    // Modo polling (desarrollo sin ngrok)
    bot.start().then(() => {
      console.log('🤖 Bot iniciado en modo polling');
    }).catch(console.error);
  }
}

// ─── Frontend (producción) ────────────────────────────────────────────────────
if (isProd) {
  const frontendDist = path.join(process.cwd(), '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});

export default app;
