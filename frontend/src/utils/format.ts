export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
}

export function getMesActual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMesLabel(mes: string): string {
  const [anio, mesNum] = mes.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
    .format(new Date(anio, mesNum - 1));
}

export function getMesesUltimos(n: number): string[] {
  const meses: string[] = [];
  const ahora = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
}

export function calcularProgreso(actual: number, objetivo: number): number {
  if (objetivo === 0) return 0;
  return Math.min(Math.round((actual / objetivo) * 100), 100);
}

export function diasHastaFecha(dia: number): number {
  const hoy = new Date();
  const vencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
  if (vencimiento < hoy) vencimiento.setMonth(vencimiento.getMonth() + 1);
  return Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
