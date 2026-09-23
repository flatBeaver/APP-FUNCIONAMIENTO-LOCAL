import { ProductionJob, JobCalculation, AppConfig, SemaphoreStatus } from '../types';

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function parseISO(s: string): Date | null {
  if (!s) return null;
  const clean = String(s).trim().slice(0, 10);
  const p = clean.split('-').map(Number);
  if (p.length !== 3 || isNaN(p[0]) || isNaN(p[1]) || isNaN(p[2])) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function difDias(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function hoyISO(): string {
  return toISO(new Date());
}

export function hoyDia(): Date {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
}

export function esFinDeSemana(d: Date): boolean {
  const w = d.getDay(); // 0 = Sunday, 6 = Saturday
  return w === 0 || w === 6;
}

export function esFestivo(d: Date, festivos: string[]): boolean {
  return (festivos || []).includes(toISO(d));
}

export function esLaborable(d: Date, festivos: string[]): boolean {
  return !esFinDeSemana(d) && !esFestivo(d, festivos);
}

/**
 * Retorna fecha en formato compacto Día/Mes (DD/MM)
 * Ej: "2026-09-18" o "2026-09-18T10:00:00Z" -> "18/09"
 */
export function formatDayMonth(isoStr?: string | null): string {
  if (!isoStr) return '—';
  const clean = String(isoStr).trim().slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3 && parts[1] && parts[2]) {
    return `${parts[2]}/${parts[1]}`;
  }
  return isoStr;
}

/**
 * Calculates due date starting from fechaInicioISO.
 * Day-by-day loop: skips weekends and holidays if business days is true.
 */
export function calcularVencimiento(fechaInicioISO: string, dias: number, festivos: string[] = []): string {
  const inicio = parseISO(fechaInicioISO);
  if (!inicio || !dias || dias <= 0) return '';
  let fecha = inicio;
  let contador = 0;
  let guarda = 0;
  while (contador < dias && guarda < 5000) {
    fecha = addDays(fecha, 1);
    if (esLaborable(fecha, festivos)) {
      contador++;
    }
    guarda++;
  }
  return toISO(fecha);
}

export function laborablesEntre(inicioISO: string, finISO: string, festivos: string[] = []): number {
  const a = parseISO(inicioISO);
  const b = parseISO(finISO);
  if (!a || !b || b < a) return 0;
  let n = 0;
  let cur = a;
  while (cur <= b) {
    if (esLaborable(cur, festivos)) n++;
    cur = addDays(cur, 1);
  }
  return n;
}

export function laborablesRestantes(vencimientoISO: string, festivos: string[] = []): number {
  const ven = parseISO(vencimientoISO);
  if (!ven) return 0;
  const hoy = hoyDia();
  if (ven <= hoy) return 0;
  let n = 0;
  let cur = hoy;
  while (cur < ven) {
    cur = addDays(cur, 1);
    if (esLaborable(cur, festivos)) n++;
  }
  return n;
}

export function calcularJob(t: ProductionJob, config: AppConfig): JobCalculation {
  const fest = config.festivos || [];
  const hoy = hoyDia();
  const ini = parseISO(t.fechaInicio);
  const ven = parseISO(t.fechaVencimiento);

  let enProdN: number | null = null;
  let enProdLab: number | null = null;
  if (ini) {
    enProdN = Math.max(0, difDias(ini, hoy));
    const labTotales = laborablesEntre(t.fechaInicio, toISO(hoy), fest);
    enProdLab = Math.max(0, labTotales - 1);
  }

  let diasRestantes: number | null = null;
  let diasLabRestantes: number | null = null;
  if (ven) {
    diasRestantes = difDias(hoy, ven);
    diasLabRestantes = laborablesRestantes(t.fechaVencimiento, fest);
  }

  const archivado = t.estado === 'Archivado';
  const umbral = Number(config.parametros.umbralAvisoDias) || 7;

  let semaforo: SemaphoreStatus;
  let claseSemaforo: string;
  let claseFila: string;

  if (archivado) {
    semaforo = 'Archivado';
    claseSemaforo = 'bg-slate-100 text-slate-600 border-slate-200';
    claseFila = 'opacity-65 border-l-4 border-l-slate-400';
  } else if (diasRestantes === null) {
    semaforo = 'Sin fecha';
    claseSemaforo = 'bg-purple-50 text-purple-700 border-purple-200';
    claseFila = 'border-l-4 border-l-purple-300';
  } else if (diasRestantes < 0) {
    semaforo = 'Vencido';
    claseSemaforo = 'bg-rose-50 text-rose-700 border-rose-200';
    claseFila = 'border-l-4 border-l-rose-500 bg-rose-50/20';
  } else if (diasRestantes <= umbral) {
    semaforo = 'Próximo a vencer';
    claseSemaforo = 'bg-amber-50 text-amber-700 border-amber-200';
    claseFila = 'border-l-4 border-l-amber-500 bg-amber-50/15';
  } else {
    semaforo = 'En curso';
    claseSemaforo = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    claseFila = 'border-l-4 border-l-emerald-500';
  }

  let colorRestantes = 'text-slate-700';
  if (diasRestantes !== null) {
    if (diasRestantes < 0) colorRestantes = 'text-rose-600 font-semibold';
    else if (diasRestantes <= umbral) colorRestantes = 'text-amber-600 font-semibold';
    else colorRestantes = 'text-emerald-700';
  }

  const avance = Math.max(0, Math.min(100, Number(t.avance) || 0));

  return {
    enProdN,
    enProdLab,
    enProduccionTxt: enProdN === null ? '—' : `${enProdN} d · ${enProdLab ?? 0} lab.`,
    diasRestantes,
    diasLabRestantes,
    restantesTxt: diasRestantes === null ? '—' : `${diasRestantes} d · ${diasLabRestantes ?? 0} lab.`,
    semaforo,
    claseSemaforo,
    claseFila,
    colorRestantes,
    avance,
  };
}
