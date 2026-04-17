import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// ─── Límites gratuitos de Gemini 1.5 Flash ────────────────────────────────────
// Google permite: 15 RPM, 1.500 RPD, 1.000.000 TPM
// Nosotros usamos márgenes de seguridad para no acercarnos nunca al límite:
const LIMITE_DIARIO = 100;     // máx 100/día (Google permite 1.500 — usamos solo el 6%)
const LIMITE_POR_MINUTO = 10;  // máx 10/min  (Google permite 15 — usamos el 66%)

// ─── Contador diario (persiste en disco) ─────────────────────────────────────
const USAGE_FILE = path.join(process.cwd(), 'data', 'gemini_usage.json');

interface UsageData {
  fecha: string;   // YYYY-MM-DD
  count: number;
}

function leerUso(): UsageData {
  try {
    const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { fecha: '', count: 0 };
  }
}

function guardarUso(data: UsageData) {
  fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
}

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}

function incrementarContador(): { ok: boolean; restantes: number } {
  const uso = leerUso();
  const hoy = fechaHoy();

  // Resetear si es un día nuevo
  if (uso.fecha !== hoy) {
    uso.fecha = hoy;
    uso.count = 0;
  }

  if (uso.count >= LIMITE_DIARIO) {
    return { ok: false, restantes: 0 };
  }

  uso.count += 1;
  guardarUso(uso);
  return { ok: true, restantes: LIMITE_DIARIO - uso.count };
}

export function consultarUsoHoy(): { count: number; limite: number; restantes: number } {
  const uso = leerUso();
  const hoy = fechaHoy();
  const count = uso.fecha === hoy ? uso.count : 0;
  return { count, limite: LIMITE_DIARIO, restantes: LIMITE_DIARIO - count };
}

// ─── Rate limiter por minuto (en memoria) ────────────────────────────────────
const solicitudesRecientes: number[] = [];

function puedeHacerSolicitud(): boolean {
  const ahora = Date.now();
  const hace60s = ahora - 60_000;

  // Limpiar solicitudes de hace más de 1 minuto
  while (solicitudesRecientes.length > 0 && solicitudesRecientes[0] < hace60s) {
    solicitudesRecientes.shift();
  }

  if (solicitudesRecientes.length >= LIMITE_POR_MINUTO) {
    return false;
  }

  solicitudesRecientes.push(ahora);
  return true;
}

// ─── Cliente Gemini ───────────────────────────────────────────────────────────
let genAI: GoogleGenerativeAI | null = null;

function getCliente(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY no configurada en .env');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ─── Función principal ────────────────────────────────────────────────────────
export async function procesarMensajeBot(
  mensaje: string,
  contexto: string
): Promise<string> {
  // 1. Comprobar límite diario
  const { ok, restantes } = incrementarContador();
  if (!ok) {
    console.warn('[Gemini] Límite diario alcanzado. No se hace la llamada.');
    return JSON.stringify({
      accion: 'NO_ENTENDIDO',
      pregunta: 'He llegado al límite de consultas de hoy. Prueba mañana o usa la app web directamente.',
    });
  }

  // 2. Comprobar límite por minuto
  if (!puedeHacerSolicitud()) {
    console.warn('[Gemini] Demasiadas solicitudes en el último minuto.');
    return JSON.stringify({
      accion: 'NO_ENTENDIDO',
      pregunta: 'Estoy recibiendo demasiadas consultas. Espera un momento e inténtalo de nuevo.',
    });
  }

  if (restantes <= 10) {
    console.warn(`[Gemini] Quedan solo ${restantes} solicitudes para hoy.`);
  }

  // 3. Llamar a Gemini
  try {
    const model = getCliente().getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.1,
      },
    });

    const prompt = `Eres el asistente financiero de una app de economía doméstica para una pareja.
Tu trabajo es interpretar mensajes en lenguaje natural y extraer información estructurada sobre gastos, ingresos, deudas y consultas.

${contexto}

Responde SIEMPRE en JSON con este formato según el tipo de acción detectada:

Para registrar un gasto:
{"accion":"GASTO","importe":number,"descripcion":"string","categoria":"ALIMENTACION|HOGAR|TRANSPORTE|OCIO|SALUD|ROPA|RESTAURANTES|SUSCRIPCIONES|OTROS","tipo":"COMUN|INDIVIDUAL","confirmacion":"mensaje amigable en español confirmando el registro"}

Para una consulta:
{"accion":"CONSULTA","tipo":"GASTOS_MES|GASTOS_USUARIO|FACTURAS_SEMANA|DEUDAS|META","respuesta":"respuesta amigable en español"}

Para registrar una deuda:
{"accion":"DEUDA","importe":number,"concepto":"string","confirmacion":"mensaje amigable en español"}

Para una aportación a meta:
{"accion":"META","nombreMeta":"string","importe":number,"nota":"string","confirmacion":"mensaje amigable en español"}

Para cuando no entiendes:
{"accion":"NO_ENTENDIDO","pregunta":"pregunta de aclaración en español, breve y amigable"}

Reglas:
- "nosotros", "los dos", "común" → tipo COMUN, si no → INDIVIDUAL
- Mercadona, Lidl, Aldi, supermercado → ALIMENTACION
- Netflix, Spotify, Amazon Prime → SUSCRIPCIONES
- Gasolina, parking, metro, bus → TRANSPORTE
- Farmacia, médico, clínica → SALUD
- Bar, restaurante, cena fuera → RESTAURANTES
- Responde SOLO el JSON, sin texto adicional, sin markdown.

Mensaje del usuario: ${mensaje}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Limpiar posibles bloques de código markdown que devuelva Gemini
    const limpio = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    // Validar que es JSON válido
    JSON.parse(limpio);
    return limpio;
  } catch (error) {
    console.error('[Gemini] Error en la llamada:', error);
    return JSON.stringify({
      accion: 'NO_ENTENDIDO',
      pregunta: 'No pude procesar tu mensaje. ¿Puedes reformularlo?',
    });
  }
}
