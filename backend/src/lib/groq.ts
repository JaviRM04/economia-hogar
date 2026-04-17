import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

// ─── Límites gratuitos de Groq ────────────────────────────────────────────────
// Groq permite: 14.400 req/día, 30 req/min con llama-3.3-70b-versatile
// Usamos márgenes conservadores:
const LIMITE_DIARIO = 80;
const LIMITE_POR_MINUTO = 15;

const USAGE_FILE = path.join(process.cwd(), 'data', 'groq_usage.json');

interface UsageData { fecha: string; count: number; }

function leerUso(): UsageData {
  try { return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8')); }
  catch { return { fecha: '', count: 0 }; }
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
  if (uso.fecha !== hoy) { uso.fecha = hoy; uso.count = 0; }
  if (uso.count >= LIMITE_DIARIO) return { ok: false, restantes: 0 };
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

const solicitudesRecientes: number[] = [];

function puedeHacerSolicitud(): boolean {
  const ahora = Date.now();
  const hace60s = ahora - 60_000;
  while (solicitudesRecientes.length > 0 && solicitudesRecientes[0] < hace60s) solicitudesRecientes.shift();
  if (solicitudesRecientes.length >= LIMITE_POR_MINUTO) return false;
  solicitudesRecientes.push(ahora);
  return true;
}

let cliente: Groq | null = null;

function getCliente(): Groq {
  if (!cliente) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY no configurada en .env');
    cliente = new Groq({ apiKey });
  }
  return cliente;
}

export async function procesarMensajeBot(mensaje: string, contexto: string): Promise<string> {
  const { ok, restantes } = incrementarContador();
  if (!ok) {
    return JSON.stringify({ accion: 'CHAT', respuesta: 'He llegado al límite de consultas de hoy (80). Mañana vuelvo a estar disponible.' });
  }
  if (!puedeHacerSolicitud()) {
    return JSON.stringify({ accion: 'CHAT', respuesta: 'Espera un momento, estoy recibiendo muchas consultas a la vez.' });
  }
  if (restantes <= 10) console.warn(`[Groq] Quedan solo ${restantes} consultas para hoy.`);

  try {
    const response = await getCliente().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de economía doméstica para una pareja española. Eres cercano, breve y útil. Respondes SIEMPRE en español.

DATOS ACTUALES:
${contexto}

Tu trabajo es entender lo que el usuario quiere y responder con JSON. Siempre responde SOLO con JSON válido, sin texto antes ni después, sin bloques markdown.

FORMATOS SEGÚN LA INTENCIÓN:

Si registra un gasto (cualquier mención de importe + lo que compró):
{"accion":"GASTO","importe":NUMBER,"descripcion":"STRING","categoria":"ALIMENTACION|HOGAR|TRANSPORTE|OCIO|SALUD|ROPA|RESTAURANTES|SUSCRIPCIONES|OTROS","tipo":"INDIVIDUAL|COMUN","confirmacion":"mensaje corto confirmando"}

Si pregunta sobre sus datos (gastos, deudas, metas, cuánto llevamos...):
{"accion":"CONSULTA","respuesta":"respuesta con los datos del contexto, breve y clara"}

Si registra una deuda (alguien debe dinero a alguien):
{"accion":"DEUDA","importe":NUMBER,"concepto":"STRING","confirmacion":"mensaje corto confirmando"}

Si aporta a una meta de ahorro:
{"accion":"META","nombreMeta":"STRING","importe":NUMBER,"confirmacion":"mensaje corto confirmando"}

Para cualquier otra cosa (saludos, preguntas sobre qué puedes hacer, conversación, ayuda...):
{"accion":"CHAT","respuesta":"respuesta natural y amigable"}

CATEGORÍAS:
- ALIMENTACION: mercadona, lidl, aldi, carrefour, supermercado, compra, fruta, verdura
- SUSCRIPCIONES: netflix, spotify, amazon prime, hbo, disney+
- TRANSPORTE: gasolina, parking, metro, bus, tren, uber, taxi
- SALUD: farmacia, médico, clínica, hospital, dentista
- RESTAURANTES: bar, restaurante, cena, comida fuera, pizza, burguer
- ROPA: zara, h&m, mango, ropa, zapatos
- HOGAR: luz, agua, gas, internet, alquiler, hipoteca, ikea, muebles
- OCIO: cine, concierto, gym, deporte, videojuegos
- OTROS: todo lo demás

TIPO DE GASTO:
- COMUN si dice: "nosotros", "los dos", "entre los dos", "común", "compartido"
- INDIVIDUAL en cualquier otro caso

CUANDO TE PREGUNTEN QUÉ PUEDES HACER, responde con algo como:
Puedo ayudarte a registrar gastos ("Mercadona 45€", "pagué 60 de gasolina"), consultar cuánto lleváis gastado, gestionar deudas entre vosotros, ver vuestras metas de ahorro y las facturas del mes. Solo escríbeme en lenguaje natural y yo me encargo.`,
        },
        { role: 'user', content: mensaje },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? '';
    // Limpiar posibles bloques markdown
    const limpio = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    JSON.parse(limpio); // validar JSON
    return limpio;
  } catch (error) {
    console.error('[Groq] Error:', error);
    return JSON.stringify({ accion: 'CHAT', respuesta: 'Algo fue mal de mi parte. Inténtalo de nuevo.' });
  }
}
