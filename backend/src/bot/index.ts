import { Bot, webhookCallback } from 'grammy';
import { prisma } from '../lib/prisma';
import { procesarMensajeBot, consultarUsoHoy } from '../lib/groq';
import fs from 'fs';
import path from 'path';
import https from 'https';

let bot: Bot | null = null;

// Fotos pendientes de asociar (telegramUserId → fileId)
const fotosPendientes = new Map<string, string>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUsuario(telegramId: string) {
  return prisma.usuario.findUnique({ where: { telegramId } });
}

function eur(n: number) {
  return n.toFixed(2).replace('.', ',') + '€';
}

function inicioFinMes() {
  const hoy = new Date();
  return {
    inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    fin: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
  };
}

function detectarCategoria(desc: string): string {
  const d = desc.toLowerCase();
  if (/mercadona|lidl|aldi|carrefour|supermercado|fruteria|frutería|verdura|fruta|compra/.test(d)) return 'ALIMENTACION';
  if (/netflix|spotify|amazon|hbo|disney|prime|suscripcion/.test(d)) return 'SUSCRIPCIONES';
  if (/gasolina|parking|metro|bus|tren|renfe|uber|taxi|combustible/.test(d)) return 'TRANSPORTE';
  if (/farmacia|medico|médico|clinica|clínica|doctor|hospital|dentista/.test(d)) return 'SALUD';
  if (/bar|restaurante|cena|comida|cafe|café|pizza|burger/.test(d)) return 'RESTAURANTES';
  if (/ropa|zara|hm|h&m|mango|zapatos|calzado/.test(d)) return 'ROPA';
  if (/luz|agua|gas|internet|telefono|teléfono|hipoteca|alquiler|comunidad|ikea|mueble/.test(d)) return 'HOGAR';
  if (/cine|concierto|teatro|gym|gimnasio|deporte|juego/.test(d)) return 'OCIO';
  return 'OTROS';
}

async function descargarFoto(fileId: string, token: string): Promise<string> {
  const fileInfo = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  ).then(r => r.json()) as { ok: boolean; result: { file_path: string } };

  if (!fileInfo.ok) throw new Error('No se pudo obtener la foto');

  const ext = path.extname(fileInfo.result.file_path) || '.jpg';
  const nombreLocal = `ticket_${Date.now()}${ext}`;
  const uploadsDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const destino = path.join(uploadsDir, nombreLocal);

  await new Promise<void>((resolve, reject) => {
    const url = `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;
    const file = fs.createWriteStream(destino);
    https.get(url, (res) => { res.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }).on('error', reject);
  });

  return `/uploads/${nombreLocal}`;
}

async function construirContexto(usuarioId: string, nombre: string): Promise<string> {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const mes = `${hoy.toLocaleString('es-ES', { month: 'long' })} ${hoy.getFullYear()}`;

  const [usuarios, gastosMes, deudas, metas, facturas] = await Promise.all([
    prisma.usuario.findMany({ select: { id: true, nombre: true } }),
    prisma.gasto.findMany({ where: { fecha: { gte: inicio, lt: fin } }, include: { usuario: { select: { nombre: true } } } }),
    prisma.deuda.findMany({ where: { estado: 'PENDIENTE' }, include: { deudor: { select: { nombre: true } }, acreedor: { select: { nombre: true } } } }),
    prisma.meta.findMany({ where: { estado: 'ACTIVA' } }),
    prisma.facturaRecurrente.findMany({ where: { activa: true } }),
  ]);

  const otroUsuario = usuarios.find(u => u.id !== usuarioId);
  const totalMes = gastosMes.reduce((acc, g) => acc + Number(g.importe), 0);
  const porUsuario: Record<string, number> = {};
  gastosMes.forEach(g => { porUsuario[g.usuario.nombre] = (porUsuario[g.usuario.nombre] || 0) + Number(g.importe); });

  const resumenDeudas = deudas.length === 0
    ? 'sin deudas pendientes'
    : deudas.map(d => `${d.deudor.nombre} debe ${eur(Number(d.importe))} a ${d.acreedor.nombre} por ${d.concepto}`).join('; ');

  const resumenMetas = metas.length === 0
    ? 'sin metas activas'
    : metas.map(m => `${m.nombre}: ${eur(Number(m.importeActual))} de ${eur(Number(m.importeObjetivo))}`).join('; ');

  const resumenFacturas = facturas.length === 0
    ? 'sin facturas'
    : facturas.map(f => `${f.nombre} ${eur(Number(f.importe))} día ${f.diaMes}`).join('; ');

  const resumenGastos = Object.entries(porUsuario).map(([n, t]) => `${n}: ${eur(t)}`).join(', ');

  return `Mes: ${mes}
Usuario hablando: ${nombre} (ID: ${usuarioId})
Otro usuario: ${otroUsuario?.nombre || 'no configurado'} (ID: ${otroUsuario?.id || ''})
Total gastado este mes: ${eur(totalMes)} (${resumenGastos})
Últimos gastos del mes: ${gastosMes.slice(-5).map(g => `${g.descripcion} ${eur(Number(g.importe))}`).join(', ') || 'ninguno'}
Deudas: ${resumenDeudas}
Metas de ahorro: ${resumenMetas}
Facturas recurrentes: ${resumenFacturas}`;
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

export function iniciarBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) { console.log('⚠️  TELEGRAM_BOT_TOKEN no configurado.'); return null; }

  bot = new Bot(token);

  // ── Fotos ─────────────────────────────────────────────────────────────────
  bot.on('message:photo', async (ctx) => {
    const usuario = await getUsuario(String(ctx.from?.id));
    if (!usuario) { await ctx.reply('No te reconozco. Pide que te configuren en la app.'); return; }

    const mejorFoto = ctx.message.photo[ctx.message.photo.length - 1];
    const caption = ctx.message.caption?.trim();

    // Si viene con caption "45 Mercadona" → registrar directo
    if (caption) {
      const match = caption.match(/^(\d+(?:[.,]\d{1,2})?)\s+(.+)$/);
      if (match) {
        try {
          const importe = parseFloat(match[1].replace(',', '.'));
          const descripcion = match[2].trim();
          const ticketUrl = await descargarFoto(mejorFoto.file_id, token);
          await prisma.gasto.create({
            data: { importe, descripcion, categoria: detectarCategoria(descripcion), tipo: 'INDIVIDUAL', usuarioId: usuario.id, fecha: new Date(), ticketUrl },
          });
          await ctx.reply(`Gasto registrado con ticket:\n*${descripcion}* — ${eur(importe)}`, { parse_mode: 'Markdown' });
          return;
        } catch { /* continuar */ }
      }
    }

    // Sin caption: guardar foto y pedir datos
    fotosPendientes.set(String(ctx.from?.id), mejorFoto.file_id);
    await ctx.reply(
      'Foto recibida. Ahora dime a qué corresponde, por ejemplo:\n\n"45 euros Mercadona"\n"120 euros entre los dos Ikea"\n\nO escríbeme "asociar al último gasto" si ya lo registraste antes.'
    );
  });

  // ── Mensajes de texto ─────────────────────────────────────────────────────
  bot.on('message:text', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    const usuario = await getUsuario(telegramId);
    if (!usuario) { await ctx.reply('No te reconozco. Pide que te configuren en la app web.'); return; }

    const texto = ctx.message.text.trim();

    // Asociar foto pendiente al último gasto
    if (/asociar|último|ultimo|anterior/.test(texto.toLowerCase()) && fotosPendientes.has(telegramId)) {
      const ultimoGasto = await prisma.gasto.findFirst({ where: { usuarioId: usuario.id }, orderBy: { createdAt: 'desc' } });
      if (ultimoGasto) {
        try {
          const ticketUrl = await descargarFoto(fotosPendientes.get(telegramId)!, token);
          await prisma.gasto.update({ where: { id: ultimoGasto.id }, data: { ticketUrl } });
          fotosPendientes.delete(telegramId);
          await ctx.reply(`Ticket asociado a: *${ultimoGasto.descripcion}* — ${eur(Number(ultimoGasto.importe))}`, { parse_mode: 'Markdown' });
          return;
        } catch { await ctx.reply('No pude guardar la foto. Inténtalo de nuevo.'); return; }
      }
    }

    await ctx.replyWithChatAction('typing');

    const contexto = await construirContexto(usuario.id, usuario.nombre);
    const respuestaRaw = await procesarMensajeBot(texto, contexto);

    let accion: Record<string, unknown>;
    try {
      accion = JSON.parse(respuestaRaw);
    } catch {
      await ctx.reply('Algo fue mal. Inténtalo de nuevo.');
      return;
    }

    switch (accion.accion) {
      case 'GASTO': {
        try {
          const fotoPendiente = fotosPendientes.get(telegramId);
          let ticketUrl: string | undefined;
          if (fotoPendiente) {
            try { ticketUrl = await descargarFoto(fotoPendiente, token); fotosPendientes.delete(telegramId); } catch { /* sin foto */ }
          }
          await prisma.gasto.create({
            data: {
              importe: Number(accion.importe),
              descripcion: String(accion.descripcion),
              categoria: String(accion.categoria || 'OTROS'),
              tipo: String(accion.tipo || 'INDIVIDUAL'),
              usuarioId: usuario.id,
              fecha: new Date(),
              ...(ticketUrl ? { ticketUrl } : {}),
            },
          });
          await ctx.reply(String(accion.confirmacion) + (ticketUrl ? ' (con ticket)' : ''));
        } catch { await ctx.reply('No pude registrar el gasto. Inténtalo de nuevo.'); }
        break;
      }

      case 'CONSULTA':
        await ctx.reply(String(accion.respuesta));
        break;

      case 'CHAT':
        await ctx.reply(String(accion.respuesta));
        break;

      case 'DEUDA': {
        try {
          const otros = await prisma.usuario.findMany({ where: { id: { not: usuario.id } } });
          if (otros.length === 0) { await ctx.reply('No hay otro usuario registrado en la app.'); break; }
          await prisma.deuda.create({
            data: { importe: Number(accion.importe), concepto: String(accion.concepto), deudorId: otros[0].id, acreedorId: usuario.id },
          });
          await ctx.reply(String(accion.confirmacion));
        } catch { await ctx.reply('No pude registrar la deuda.'); }
        break;
      }

      case 'META': {
        try {
          const nombreMeta = String(accion.nombreMeta).toLowerCase();
          const todasMetas = await prisma.meta.findMany({ where: { estado: 'ACTIVA' } });
          const meta = todasMetas.find(m => m.nombre.toLowerCase().includes(nombreMeta));
          if (!meta) { await ctx.reply(`No encontré la meta "${accion.nombreMeta}". ¿Cuál es el nombre exacto?`); break; }
          const nueva = Number(meta.importeActual) + Number(accion.importe);
          await prisma.$transaction([
            prisma.aportacion.create({ data: { metaId: meta.id, importe: Number(accion.importe), usuarioId: usuario.id } }),
            prisma.meta.update({ where: { id: meta.id }, data: { importeActual: nueva } }),
          ]);
          await ctx.reply(String(accion.confirmacion));
        } catch { await ctx.reply('No pude registrar la aportación.'); }
        break;
      }

      default:
        await ctx.reply(String(accion.respuesta || accion.pregunta || 'No entendí bien. Inténtalo de nuevo.'));
    }
  });

  bot.catch((err) => { console.error('Error en bot:', err); });

  return bot;
}

export function obtenerBot() { return bot; }
export { webhookCallback } from 'grammy';
